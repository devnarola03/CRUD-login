const customer = require('./customer');

const googleAuthDal = {
    registerWithGoogle: async (oauthUser) => {
        console.log(oauthUser);
        const isUserExists = await customer.findOne({
            email: oauthUser.email,
        });
        if (isUserExists) {
            const failure = {
                message: 'User already Registered.',
            };
            return { failure };
        }

        const user = new customer({
            firstname: oauthUser.displayName,
            email: oauthUser.emails[0].value,
        });
        await user.save();
        const success = {
            message: 'User Registered.',
        };
        return { success };
    },

    // loginUser: async (oauthUser) => {
    //   const userExists = await User.findOne({ email: oauthUser.emails[0].value });
    //   if (userExists) {
    //     const success = {
    //       message: 'User successfully logged In.',
    //     };
    //     return { success };
    //   }
    //   const failure = {
    //     message: 'Email not Registered. You need to sign up first',
    //   };
    //   return { failure };
    // },
};

module.exports = googleAuthDal;