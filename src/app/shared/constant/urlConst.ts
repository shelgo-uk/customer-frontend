import { environment } from "../environment/environment";

export let urlConstant: any = {};

export function rebuildUrlConstant() {
  urlConstant = {
    FilesAPI: {
      fileUpload: environment.APIUrl + 'file/upload',
    },
    SiteConfigAPI: {
      getSiteConfig: environment.APIUrl + 'siteconfig/getSiteconfig',
    },
    HomeBannerAPI: {
      getActiveBanners: environment.APIUrl + 'homebanner/getActiveBanners',
    },
    CategoryAPI: {
      getPublicCategories: environment.APIUrl + 'category/getPublicCategories',
    },
    BrandAPI: {
      getActiveBrands: environment.APIUrl + 'brand/getActiveBrands',
    },
    ProductAPI: {
      getProducts: environment.APIUrl + 'product/getProducts',
      getProduct: environment.APIUrl + 'product/getProduct/',
      getRelated: environment.APIUrl + 'product/getRelated',
      getReviews: environment.APIUrl + 'product/getReviews/',
      addReview: environment.APIUrl + 'product/addReview/',
    },
    CustomerAPI: {
      register: environment.APIUrl + 'customer/register',
      login:    environment.APIUrl + 'customer/login',
      profile:  environment.APIUrl + 'customer/profile',
    },
    CustomerAddressAPI: {
      base: environment.APIUrl + 'customer-address',
    },
    PaymentSettingsAPI: {
      getPublic: environment.APIUrl + 'payment-settings/public',
    },
    OrderAPI: {
      createOrder: environment.APIUrl + 'orders/createOrder',
      getByCustomer: environment.APIUrl + 'orders/getByCustomer/',
      getById: environment.APIUrl + 'orders/getById/',
    },
    PromoBannerAPI: {
      getActive: environment.APIUrl + 'promo-banners/getActive',
    },
    CategoryPageAPI: {
      getPublic: environment.APIUrl + 'category-page/public/',
    },
    PolicyAPI: {
      getAll:    environment.APIUrl + 'policies/getAll',
      getBySlug: environment.APIUrl + 'policies/',
    },
    FaqAPI: {
      getCategories:  environment.APIUrl + 'faq/public/categories',
      getArticles:    environment.APIUrl + 'faq/public/categories/',
      getArticle:     environment.APIUrl + 'faq/public/articles/',
    },
    ContactAPI: {
      submit: environment.APIUrl + 'contact/submit',
    },
  };
}

rebuildUrlConstant();