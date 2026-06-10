import {
  createRouter as _createRouter,
  createMemoryHistory,
  createWebHistory,
} from "vue-router";

export function createRouter() {
  return _createRouter({
    history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
    routes: [
      {
        path: "/",
        name: "home",
        component: () => import("./pages/Home.vue"),
      },
      {
        path: "/:pathMatch(.*)*",
        name: "not-found",
        component: () => import("./pages/NotFound.vue"),
      },
    ],
  });
}
