const { AuthenticationError } = require('apollo-server-express');
// import user and book models
const { User, Book } = require('../models');
const { signToken } = require('../utils/auth')

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        return User.findOne({ _id: context.user._id }).populate('savedBooks')
      }
      throw new AuthenticationError('You must be logged in')
    }
  },
  Mutation: {
    saveBook: async (parent, { input }, context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }
      const updatedUser = await User.findOneAndUpdate(
        { _id: context.user._id },
        { $addToSet: { savedBooks: input } },
        { new: true, runValidators: true }
      );
      return updatedUser;
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('No user found with this email address');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const token = signToken(user);

      return { token, user };
    },
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);
      return { token, user }
    },
    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        // const book = await Book.findOneAndDelete({
        //   _id: bookId  
        // });

        return await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: {bookId} }},
          { new: true }
        )
      }
      throw new AuthenticationError('You need to be logged in')
    },
  },
};

module.exports = resolvers;