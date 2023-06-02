const Hapi = require('@hapi/hapi');
const routes = require('./routes.js');

const init = async () => {
  const port = process.env.PORT || 5000;
  const server = Hapi.server({
    port,
    host: process.env.NODE_ENV !== 'production' ? 'localhost' : '0.0.0.0',
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
