import { GraphQLServer, PubSub } from "graphql-yoga";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

//graphQL type definitions
const typeDefs = `
  type Message {
    id: ID!
    user: User!
    text: String!
  }
  type User {
    id: ID!
    name: String!
  }
  type Query {
    messages: [Message!]
    user(name:String!): User
  }
  type Mutation {
    createUser(name: String!):ID
    postMessage(userId: Int!, text: String!): ID!
  }
  type Subscription {
    messages: [Message!]
  }
`;

let messages = [];
const subscribers = [];
const onMessagesUpdates = (fn) => subscribers.push(fn);

//to perform functions on each Type
const resolvers = {
  Query: {
    messages: async () => await prisma.message.findMany(), //returns messages
    user: async (parent, { name }) =>
      await prisma.user.findFirst({ where: { name } }),
  },
  Mutation: {
    //post new message and returns id
    createUser: async (parent, { name }) => {
      try {
        const user = await prisma.user.create({
          data: {
            name,
          },
        });
        return user.id;
      } catch (error) {
        return "Error";
      }
    },
    postMessage: async (parent, { userId, text }) => {
      const m = await prisma.message.create({
        data: {
          text,
          userId: userId,
        },
      });
      const id = messages.length;
      const username = await prisma.user.findFirst({ where: { id: userId } });
      messages.push({
        id: m.id,
        user: username.name,
        text: m.text,
      });
      subscribers.forEach((fn) => fn());
      return m.id;
      console.log(messages);
    },
  },
  Subscription: {
    messages: {
      subscribe: async (parent, args, { pubsub }) => {
        const msg = await prisma.message.findMany({
          select: { id: true, text: true, user: { select: { name: true } } },
        });
        messages = [...msg];
        const channel = Math.random().toString(36).slice(2, 15);
        onMessagesUpdates(() => pubsub.publish(channel, { messages }));
        setTimeout(() => pubsub.publish(channel, { messages }), 0);
        return pubsub.asyncIterator(channel);
      },
    },
  },
};

const pubsub = new PubSub();
const server = new GraphQLServer({ typeDefs, resolvers, context: { pubsub } });
server.start(({ port }) => {
  console.log(`Server on http://127.0.0.1:${port}/`);
});
