// Generate a unique 6-character alphanumeric code
const generateUserCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Get account group ID for a user (handles shared accounts)
const getAccountGroupId = async (user, AccountGroup) => {
  const User = require('../models/User');
  
  // If user already has an account group, return it
  if (user.accountGroup) {
    return user.accountGroup;
  }

  // If user was invited by someone, find their account group
  if (user.invitedByCode) {
    const inviter = await User.findOne({ userCode: user.invitedByCode });
    if (inviter) {
      // Ensure inviter has an account group
      let inviterGroupId = inviter.accountGroup;
      if (!inviterGroupId) {
        // Create account group for inviter if they don't have one
        const newGroup = await AccountGroup.create({
          groupCode: inviter.userCode,
          createdBy: inviter._id,
        });
        inviter.accountGroup = newGroup._id;
        await inviter.save();
        inviterGroupId = newGroup._id;
      }
      // Update current user to use the same account group
      user.accountGroup = inviterGroupId;
      await user.save();
      return inviterGroupId;
    }
  }

  // If user's code was used by someone else, find that user's account group
  const invitedUser = await User.findOne({ invitedByCode: user.userCode });
  if (invitedUser) {
    // Ensure invited user has an account group
    let invitedUserGroupId = invitedUser.accountGroup;
    if (!invitedUserGroupId) {
      // Create account group for invited user if they don't have one
      const newGroup = await AccountGroup.create({
        groupCode: invitedUser.userCode,
        createdBy: invitedUser._id,
      });
      invitedUser.accountGroup = newGroup._id;
      await invitedUser.save();
      invitedUserGroupId = newGroup._id;
    }
    // Update current user to use the same account group
    user.accountGroup = invitedUserGroupId;
    await user.save();
    return invitedUserGroupId;
  }

  // Create new account group for this user
  const newGroup = await AccountGroup.create({
    groupCode: user.userCode,
    createdBy: user._id,
  });

  user.accountGroup = newGroup._id;
  await user.save();
  return newGroup._id;
};

module.exports = {
  generateUserCode,
  getAccountGroupId,
};

