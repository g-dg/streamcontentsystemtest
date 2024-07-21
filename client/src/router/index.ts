import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      name: "home",
      path: "/",
      component: () => import("@/views/HomeView.vue"),
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
      },
    },
  ],
});

export default router;
