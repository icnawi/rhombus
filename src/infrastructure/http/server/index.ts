import fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from "fastify";
import { type TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import routes from "@infrastructure/http/routes";
import { MangoEventRepo } from "@infrastructure/repositories/mango-event.repo";
import docs from "@infrastructure/http/plugins/docs";
import config from "@infrastructure/http/plugins/config";

export const createServer = async (): Promise<FastifyInstance> => {
  const envToLogger: any = {
    development: {
      transport: {
        target: "pino-pretty",
        options: {
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
        },
      },
    },
    production: true,
    test: false,
  };

  const environment = process.env.NODE_ENV ?? "production";

  const serverOptions: FastifyServerOptions = {
    ajv: {
      customOptions: {
        removeAdditional: "all",
        coerceTypes: true,
        useDefaults: true,
        keywords: ["kind", "modifier"],
      },
    },
    logger: envToLogger[environment] ?? true,
  };
  const server = fastify(serverOptions).withTypeProvider<TypeBoxTypeProvider>();

  await server.register(docs);
  await server.register(config);

  const mangoEventsRepository = new MangoEventRepo();

  const applicationRoutes = routes(mangoEventsRepository);
  applicationRoutes.forEach((route) => {
    server.route(route);
  });

  await server.ready();
  return server;
};
