export type Category = { id:string;name:string;description:string;image:string;color:string;product_count:number;sort_order:number };
export type Product = { id:string;name:string;category_id:string;category_name:string;description:string;unit:string;price:number;old_price:number|null;stock:number;image:string;badge:string;rating:string;review_count:number;is_active:number;created_at:string };
export type CartItem = { id:string; quantity:number; product:Product };
export type QuoteItem = { id:string;name:string;unit:string;price:number;stock:number;image:string;quantity:number;line_total:number };
export type Quote = { items:QuoteItem[];subtotal:number;discount:number;delivery_fee:number;total:number;promo_code:string;promo_error:string;delivery_type:string };
export type User = {id:string;name:string;email:string;phone:string;role:string};
export type Config = {demo:boolean;paystack_enabled:boolean;cod_enabled:boolean;reset_enabled:boolean;image_upload_enabled:boolean};
export type Order = {reference:string;name:string;email:string;phone:string;address:string;instructions:string;delivery_date:string;delivery_time:string;delivery_type:string;subtotal:number;discount:number;delivery_fee:number;total:number;promo_code:string;payment_method:string;payment_status:string;status:string;created_at:string;updated_at:string;items:{name:string;unit:string;price:number;quantity:number;image:string}[]};
