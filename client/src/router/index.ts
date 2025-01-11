import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      name: "home",
      path: "/",
      component: () => import("@/views/ControllerView.vue"),
      meta: {
        showHeaderFooter: false,
      },
    },
    {
      name: "controller",
      path: "/control/:controllerType?",
      component: () => import("@/views/ControllerView.vue"),
      props: true,
      meta: {
        showHeaderFooter: false,
      },
    },
    {
      name: "about",
      path: "/about",
      component: () => import("@/views/AboutView.vue"),
    },
    {
      name: "renderer",
      path: "/display/:displayName",
      component: () => import("@/views/RenderView.vue"),
      props: true,
      meta: {
        showHeaderFooter: false,
        noTheme: true,
      },
    },
    {
      name: "404",
      path: "/:pathMatch(.*)*",
      redirect: {
        name: "home"
      },
    }
  ],
});

export default router;
