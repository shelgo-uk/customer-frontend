import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { NgbModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { ToastrModule } from 'ngx-toastr';
import { Interceptor } from './shared/services/intercenptor';
import { SpinnerComponent } from './shared/components/spinner/spinner.component';
import { ViewImageComponent } from './shared/components/view-image/view-image.component';
import { ViewContentComponent } from './shared/components/view-content/view-content.component';
import { NgxSimpleTextEditorModule } from 'ngx-simple-text-editor';
import { OnlyNumberDirective } from './shared/directive/only-number.directive';
import { DeleteConfirmationComponent } from './shared/components/delete-confirmation/delete-confirmation.component';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ConfigService } from './shared/services/config.service';
import { AppStoreService } from './shared/services/app-store.service';
import { HomeComponent } from './components/home/home.component';
import { ShopComponent } from './components/shop/shop.component';
import { ProductDetailComponent } from './components/product-detail/product-detail.component';
import { FileUploadComponent } from './shared/components/file-upload/file-upload.component';
import { FavouritesComponent } from './components/favourites/favourites.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { AccountComponent } from './components/account/account.component';
import { CartComponent } from './components/cart/cart.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { OrderSuccessComponent } from './components/order-success/order-success.component';
import { CookieConsentComponent } from './shared/components/cookie-consent/cookie-consent.component';
import { CategoryPageComponent } from './components/category-page/category-page.component';
import { PolicyComponent } from './components/policy/policy.component';
import { SiteMapComponent } from './components/site-map/site-map.component';
import { FaqComponent } from './components/faq/faq.component';
import { ContactComponent } from './components/contact/contact.component';

// Step 1: Load config only (local JSON file — instant, no network wait)
export function initAppConfig(cfg: ConfigService) {
  return () => cfg.load();
}

// Only await local config.json — instant. API calls fire in background.
export function initAppStore(cfg: ConfigService, store: AppStoreService) {
  return async () => {
    await cfg.load();
    store.loadAllAsync(); // fire-and-forget — no await
  };
}

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    LayoutComponent,
    SpinnerComponent,
    ViewImageComponent,
    ViewContentComponent,
    DeleteConfirmationComponent,
    FileUploadComponent,
    HomeComponent,
    ShopComponent,
    ProductDetailComponent,
    FavouritesComponent,
    LoginComponent,
    RegisterComponent,
    AccountComponent,
    CartComponent,
    CheckoutComponent,
    OrderSuccessComponent,
    CookieConsentComponent,
    CategoryPageComponent,
    PolicyComponent,
    SiteMapComponent,
    FaqComponent,
    ContactComponent,
  ],
  imports: [
    CommonModule,
    OnlyNumberDirective,
    FormsModule,
    BrowserModule,
    NgxPaginationModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    NgbModule,
    NgbTooltip,
    NgMultiSelectDropDownModule,  
    ToastrModule.forRoot(),
    NgxSimpleTextEditorModule,
    NgApexchartsModule
  ],
  providers: [
    // Single initializer — config loads first, then store (sequential, guaranteed order)
    { provide: APP_INITIALIZER, useFactory: initAppStore, deps: [ConfigService, AppStoreService], multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: Interceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
