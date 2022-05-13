import { ApolloServer } from "apollo-server";

import { schema } from './schema';
import { context } from "./context";

export const server = new ApolloServer({
    schema,
    context
});

const PORT = 3000;

server.listen({port: PORT}).then(({url}) => {
    console.log(`🚀  Server ready at ${url}`);
})
