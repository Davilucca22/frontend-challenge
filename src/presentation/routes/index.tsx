import { createRootRoute, createRoute, createRouter, lazyRouteComponent } from '@tanstack/react-router'
import type { NFTSearch } from '../../domain/entities/NFT'
import { RootLayout, NotFoundPage } from '../layouts/RootLayout'

const rootRoute = createRootRoute({ component: RootLayout, notFoundComponent: NotFoundPage })

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: (search: Record<string, unknown>): NFTSearch => ({
    q: typeof search.q === 'string' ? search.q : undefined,
    category: typeof search.category === 'string' ? search.category : undefined,
    network: typeof search.network === 'string' ? search.network : undefined,
    min: typeof search.min === 'string' ? search.min : undefined,
    max: typeof search.max === 'string' ? search.max : undefined,
    sort: search.sort === 'price-asc' || search.sort === 'price-desc' ? search.sort : 'recent',
    page: typeof search.page === 'number' && search.page > 0 ? search.page : 1,
  }),
  component: lazyRouteComponent(() => import('../pages/HomePage'), 'HomePage'),
})
const nftRoute = createRoute({ getParentRoute: () => rootRoute, path: '/nft/$nftId', component: lazyRouteComponent(() => import('../pages/NFTPage'), 'NFTPage') })
const cartRoute = createRoute({ getParentRoute: () => rootRoute, path: '/cart', component: lazyRouteComponent(() => import('../pages/CartPage'), 'CartPage') })
const checkoutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/checkout', component: lazyRouteComponent(() => import('../pages/CheckoutPage'), 'CheckoutPage') })
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: (search: Record<string, unknown>) => ({ redirect: typeof search.redirect === 'string' ? search.redirect : '/' }),
  component: lazyRouteComponent(() => import('../pages/LoginPage'), 'LoginPage'),
})
const registerRoute = createRoute({ getParentRoute: () => rootRoute, path: '/register', component: lazyRouteComponent(() => import('../pages/RegisterPage'), 'RegisterPage') })
const profileRoute = createRoute({ getParentRoute: () => rootRoute, path: '/profile', component: lazyRouteComponent(() => import('../pages/ProfilePage'), 'ProfilePage') })
const walletsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/wallets', component: lazyRouteComponent(() => import('../pages/WalletsPage'), 'WalletsPage') })
const orderRoute = createRoute({ getParentRoute: () => rootRoute, path: '/orders/$orderId', component: lazyRouteComponent(() => import('../pages/OrderPage'), 'OrderPage') })

const routeTree = rootRoute.addChildren([homeRoute, nftRoute, cartRoute, checkoutRoute, loginRoute, registerRoute, profileRoute, walletsRoute, orderRoute])

export const router = createRouter({ routeTree, defaultPreload: 'intent', scrollRestoration: true })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
