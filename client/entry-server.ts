import { createApp } from "./main";
import { renderToString } from "vue/server-renderer";

export async function render(url: string) {
  const { app, router } = createApp();

  // set the router's location on the server
  await router.push(url);
  await router.isReady();

  // render the app instance to an HTML string
  const ctx = {};
  const html = await renderToString(app, ctx);

  const isNotFound = router.currentRoute.value.name === "not-found";

  return { html, isNotFound };
}
