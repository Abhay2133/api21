// H3 middleware: logs method, URL, status, and response time for every request
export default defineEventHandler((event) => {
  const start = Date.now();
  const { method, url } = event.node.req;

  event.node.res.on("finish", () => {
    const ms = Date.now() - start;
    const status = event.node.res.statusCode;
    console.log(`${method} ${url} ${status} - ${ms}ms`);
  });
});
