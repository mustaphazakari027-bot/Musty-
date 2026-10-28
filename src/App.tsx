import {Heart,Home as HomeIcon,ShoppingBasket,UserRound,LayoutGrid} from 'lucide-react';
import {Link,Route,Routes,useLocation} from 'react-router-dom';
import Footer from './components/Footer';
import Header from './components/Header';
import {Toast} from './components/ui';
import {useStore} from './store';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Categories from './pages/Categories';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import CheckoutReturn from './pages/CheckoutReturn';
import OrderView from './pages/OrderView';
import Track from './pages/Track';
import Contact from './pages/Contact';
import Policies from './pages/Policies';
import Favorites from './pages/Favorites';
import Account from './pages/Account';
import {Login,Register,Forgot,Reset} from './pages/Auth';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';

function BottomNav(){const {count}=useStore();const {pathname}=useLocation();if(pathname.startsWith('/admin')||pathname.startsWith('/checkout'))return null;
  const items=[{to:'/',label:'Home',icon:HomeIcon},{to:'/categories',label:'Shop',icon:LayoutGrid},{to:'/cart',label:'Basket',icon:ShoppingBasket,badge:count},{to:'/favorites',label:'Saved',icon:Heart},{to:'/account',label:'Account',icon:UserRound}];
  return <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e7ebe1] bg-[#fbfaf5] px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-18px_rgba(23,63,48,.5)] sm:hidden"><div className="flex justify-around">{items.map(({to,label,icon:Icon,badge})=>{const active=pathname===to;return <Link key={to} to={to} aria-current={active?'page':undefined} className="relative flex w-full flex-col items-center gap-1 py-2.5"><Icon size={19} className={active?'text-[#126448]':'text-[#8c998e]'} strokeWidth={active?2.4:2}/><span className={`text-[9.5px] font-bold ${active?'text-[#126448]':'text-[#8c998e]'}`}>{label}</span>{!!badge&&<span className="absolute right-[26%] top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#126448] px-0.5 text-[9px] font-bold text-white">{badge}</span>}</Link>;})}</div></nav>;
}
export default function App(){const {pathname}=useLocation();return <div className="flex min-h-screen flex-col bg-[#f9f8f1]"><a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm">Skip to content</a><Header/><main id="main" className="flex-1 pb-20 sm:pb-0"><Routes>
  <Route path="/" element={<Home/>}/><Route path="/shop" element={<Shop/>}/><Route path="/categories" element={<Categories/>}/><Route path="/product/:id" element={<ProductDetail/>}/><Route path="/cart" element={<Cart/>}/><Route path="/checkout" element={<Checkout/>}/><Route path="/checkout/return" element={<CheckoutReturn/>}/><Route path="/order/:reference" element={<OrderView/>}/><Route path="/track" element={<Track/>}/><Route path="/contact" element={<Contact/>}/><Route path="/policies" element={<Policies/>}/><Route path="/favorites" element={<Favorites/>}/><Route path="/account" element={<Account/>}/><Route path="/login" element={<Login/>}/><Route path="/register" element={<Register/>}/><Route path="/forgot-password" element={<Forgot/>}/><Route path="/reset-password" element={<Reset/>}/><Route path="/admin/*" element={<Admin/>}/><Route path="*" element={<NotFound/>}/>
</Routes></main>{!pathname.startsWith('/admin')&&<Footer/>}<BottomNav/><Toast/></div>;}
