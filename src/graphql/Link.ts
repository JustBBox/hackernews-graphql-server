import { arg, enumType, extendType, inputObjectType, intArg, list, nonNull, objectType, stringArg, } from "nexus";
import { Prisma } from "@prisma/client"
import { GraphQLList } from "graphql";

type LinkData = {
    description?: string;
    url?: string;
}
type dbData = {
    data: LinkData
}

export const Link = objectType({
    name: 'Link',
    definition(t) {
        t.nonNull.int("id");
        t.nonNull.string("description");
        t.nonNull.string("url");
        t.nonNull.dateTime("createdAt");
        t.field("postedBy", {
            type: "User",
            resolve(parent, args, context) {
                return context.prisma.link
                    .findUnique({ where: { id: parent.id } })
                    .postedBy();
            }
        });
        t.nonNull.list.nonNull.field("voters", {
            type: "User",
            resolve(parent, args, context) {
                return context.prisma.link
                    .findUnique({ where: { id: parent.id } })
                    .voters();
            }
        });
    }
});

export const LinkOrderByInput = inputObjectType({
    name: "LinkOrderByInput",
    definition(t) {
        t.field("description", { type: Sort });
        t.field("url", { type: Sort });
        t.field("createdAt", { type: Sort });
    }
})

export const Sort = enumType({
    name: "Sort",
    members: ["asc", "desc"]
});

export const Feed = objectType({
    name: "Feed",
    definition(t) {
        t.nonNull.list.nonNull.field("links", { type: Link });
        t.nonNull.int("count");
        t.id("id");
    }
})

export const FeedQuery = extendType({
    type: "Query",
    definition(t) {
        t.nonNull.field("feed", {
            type: "Feed",
            args: {
                filter: stringArg(),
                skip: intArg(),
                take: intArg(),
                orderBy: arg({ type: list(nonNull(LinkOrderByInput)) })
            },
            async resolve(parent, args, context, info) {
                const where = args.filter
                    ? {
                        OR: [
                            { description: { contains: args.filter } },
                            { url: { contains: args.filter } }
                        ]
                    }
                    : {};
                const links = await context.prisma.link.findMany({
                    where,
                    skip: args?.skip as number | undefined,
                    take: args?.take as number | undefined,
                    orderBy: args?.orderBy as
                        | Prisma.Enumerable<Prisma.LinkOrderByWithRelationInput>
                        | undefined,
                });

                const count = await context.prisma.link.count({ where });
                const id = `main-feed:${JSON.stringify(args)}`;

                return {
                    links,
                    count,
                    id
                }
            }
        })
    }
});

export const LinkQuery = extendType({
    type: "Query",
    definition(t) {
        t.nonNull.field("link", {
            type: "Link",
            args: {
                id: nonNull(intArg())
            },
            resolve(parent, args, context, info) {
                return context.prisma.link.findFirst({
                    where: {
                        id: args.id
                    }
                });
            }
        })
    }
});

export const LinkMutation = extendType({
    type: "Mutation",
    definition(t) {
        t.nonNull.field("post", {
            type: "Link",
            args: {
                description: nonNull(stringArg()),
                url: nonNull(stringArg())
            },

            resolve(parent, args, context) {
                const { description, url } = args;
                const { userId } = context;

                if (!userId) {
                    throw new Error("Cannot post without logging in.")
                }

                const newLink = context.prisma.link.create({
                    data: {
                        description,
                        url,
                        postedBy: { connect: { id: userId } }
                    }
                });

                return newLink;
            }
        });
    },
})

export const DeleteLinkMutation = extendType({
    type: "Mutation",
    definition(t) {
        t.nonNull.field("deletingLink", {
            type: "Link",
            args: {
                id: nonNull(intArg())
            },

            resolve(parent, args, context) {
                const { id } = args;
                const removedLink = context.prisma.link.delete({
                    where: {
                        id: id
                    }
                });
                return removedLink;
            }
        });
    },
})

export const UpdateLinkMutation = extendType({
    type: "Mutation",
    definition(t) {
        t.nonNull.field("updatingLink", {
            type: "Link",
            args: {
                id: nonNull(intArg()),
                url: stringArg(),
                description: stringArg()
            },

            resolve(parent, args, context) {
                const { id, description, url } = args;
                const updatedData: LinkData = {};
                if (description) updatedData.description = description;
                if (url) updatedData.url = url;

                const modifiedLink = context.prisma.link.update({
                    where: {
                        id: id
                    },
                    data: updatedData
                });
                return modifiedLink;
            }
        });
    },
});
