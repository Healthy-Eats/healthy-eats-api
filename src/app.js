const Hapi = require('@hapi/hapi');
const routes = require('./routes.js');

const init = async () => {
  const server = Hapi.server({
    port: 5000,
    host: '0.0.0.0',
    routes: {
        cors: {
            origin: ['*'], //isi url frontend & ML
        },
    },
  });

  server.route(routes);

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
