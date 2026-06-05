import { Routes } from "@angular/router";
import { HomeComponent } from "../../components/home/home.component";
import { ShopComponent } from "../../components/shop/shop.component";
import { ProductDetailComponent } from "../../components/product-detail/product-detail.component";
import { FavouritesComponent } from "../../components/favourites/favourites.component";
import { LoginComponent } from "../../components/auth/login/login.component";
import { RegisterComponent } from "../../components/auth/register/register.component";
import { AccountComponent } from "../../components/account/account.component";
import { CartComponent } from "../../components/cart/cart.component";
import { CheckoutComponent } from "../../components/checkout/checkout.component";
import { OrderSuccessComponent } from "../../components/order-success/order-success.component";
import { GuestGuard } from "../guards/auth.guard";
import { CategoryPageComponent } from "../../components/category-page/category-page.component";
import { PolicyComponent } from "../../components/policy/policy.component";
import { SiteMapComponent } from "../../components/site-map/site-map.component";
import { FaqComponent } from "../../components/faq/faq.component";
import { ContactComponent } from "../../components/contact/contact.component";

export const routing: Routes = [
    { path: '',              component: HomeComponent },
    { path: 'home',          component: HomeComponent },
    { path: 'shop',          component: ShopComponent },
    { path: 'category/:slug', component: CategoryPageComponent },
    { path: 'product/:slug', component: ProductDetailComponent },
    { path: 'wishlist',      component: FavouritesComponent },
    { path: 'favourites',    component: FavouritesComponent },
    { path: 'cart',          component: CartComponent },
    { path: 'bag',           component: CartComponent },
    { path: 'checkout',      component: CheckoutComponent },
    { path: 'order-success/:id', component: OrderSuccessComponent },
    { path: 'policy/:slug',  component: PolicyComponent },
    { path: 'site-map',      component: SiteMapComponent },
    { path: 'help/faq',      component: FaqComponent },
    { path: 'help/contact',  component: ContactComponent },
    { path: 'contact',       component: ContactComponent },

    { path: 'login',    component: LoginComponent,    canActivate: [GuestGuard] },
    { path: 'register', component: RegisterComponent, canActivate: [GuestGuard] },
    { path: 'account',           component: AccountComponent },
    { path: 'account-dashboard', component: AccountComponent },

    { path: '**', redirectTo: '' },
]
