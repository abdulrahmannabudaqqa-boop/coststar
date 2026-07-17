/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Laptop, 
  Monitor, 
  Printer, 
  ChevronLeft, 
  Phone, 
  CheckCircle2, 
  Building2, 
  TrendingUp, 
  ShieldCheck,
  Package,
  Menu,
  X,
  Plus,
  Edit2,
  MapPin,
  Save,
  Trash2,
  LayoutDashboard,
  LogOut,
  Info,
  Settings,
  Mail,
  ArrowRight,
  Upload,
  Lock,
} from 'lucide-react';
import { Product, Category, SiteConfig } from './types';
import { 
  db, 
  auth, 
  handleFirestoreError, 
  OperationType 
} from './lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  addDoc
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';

const INITIAL_SITE_CONFIG: SiteConfig = {
  name: 'مؤسسة النجم الساحلي',
  location: 'الرياض - طريق الملك فهد - مركز الجفالي التجاري - الطابق الأرضي',
  phone: '059 000 0000',
  email: 'info@starcoast.com',
  description: 'حلول تقنية متكاملة لتجارة أجهزة الكمبيوتر والطابعات. نقدم نخبة من الأجهزة الجديدة والمستعملة بعناية فائقة لتلبية طموحاتكم.',
  aboutText: 'في مؤسسة النجم الساحلي، نؤمن بأن التقنية يجب أن تكون في متناول الجميع بجودة لا تساوم. خبرتنا التي تمتد لأكثر من 10 سنوات تجعلنا الشريك الموثوق للأفراد والشركات في المملكة العربية السعودية، حيث نضمن لكل عميل الشفافية الكاملة والدعم الفني المتميز.'
};

const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Lenovo ThinkPad T480', category: 'laptop', subCategory: 'مستعمل ممتاز', specs: 'i5 / RAM 8GB / SSD 256', price: 1250, isSold: false, icon: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=60' },
  { id: '2', name: 'HP LaserJet Pro M404dn', category: 'print', subCategory: 'جديد', specs: 'طباعة ليزر أحادية', price: 1650, isSold: false, icon: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800&auto=format&fit=crop&q=60' },
  { id: '3', name: 'Dell OptiPlex 7070', category: 'desktop', subCategory: 'مستعمل', specs: 'i7 / RAM 16GB / SSD 512', price: 1800, isSold: true, icon: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800&auto=format&fit=crop&q=60' },
  { id: '4', name: 'طقم لوحة مفاتيح وفأرة لاسلكي', category: 'print', subCategory: 'ملحقات جديد', specs: 'عربي / إنجليزي', price: 110, isSold: false, icon: 'https://images.unsplash.com/photo-1587829741301-dc798b83dadc?w=800&auto=format&fit=crop&q=60' },
  { id: '5', name: 'ASUS VivoBook 15', category: 'laptop', subCategory: 'جديد', specs: 'i5 / RAM 8GB / SSD 512', price: 2190, isSold: false, icon: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop&q=60' },
  { id: '6', name: 'Samsung 24" IPS Monitor', category: 'desktop', subCategory: 'مستعمل ممتاز', specs: 'Full HD / 75Hz', price: 490, isSold: false, icon: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=60' },
];

const Logo = ({ className = "w-12 h-12" }: { className?: string }) => (
  <div className={`${className} bg-white rounded-xl flex items-center justify-center shadow-md border border-line p-1.5`}>
    <svg viewBox="0 0 100 100" className="w-full h-full text-[#2D5A27]" fill="currentColor">
      <path d="M50 5 L63.5 35 L95 38 L72.5 60 L78 92 L50 78 L22 92 L27.5 60 L5 38 L36.5 35 Z" />
    </svg>
  </div>
);

interface AdminDashboardProps {
  adminTab: 'overview' | 'products' | 'tenders' | 'settings';
  setAdminTab: React.Dispatch<React.SetStateAction<'overview' | 'products' | 'tenders' | 'settings'>>;
  isAdminMode: boolean;
  setIsAdminMode: React.Dispatch<React.SetStateAction<boolean>>;
  setIsAdminView: React.Dispatch<React.SetStateAction<boolean>>;
  tempSiteConfig: SiteConfig;
  setTempSiteConfig: React.Dispatch<React.SetStateAction<SiteConfig>>;
  tempProducts: Product[];
  setTempProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  handleSaveAll: () => void;
  handleCancelChanges: () => void;
  isAddingProduct: boolean;
  setIsAddingProduct: React.Dispatch<React.SetStateAction<boolean>>;
  newProduct: Partial<Product>;
  setNewProduct: React.Dispatch<React.SetStateAction<Partial<Product>>>;
  addProduct: () => void;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  handleLogout: () => Promise<void>;
}

const AdminDashboard = ({
  adminTab,
  setAdminTab,
  isAdminMode,
  setIsAdminMode,
  setIsAdminView,
  tempSiteConfig,
  setTempSiteConfig,
  tempProducts,
  setTempProducts,
  handleSaveAll,
  handleCancelChanges,
  isAddingProduct,
  setIsAddingProduct,
  newProduct,
  setNewProduct,
  addProduct,
  setIsLoggedIn,
  handleLogout
}: AdminDashboardProps) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 1.02 }}
    className="fixed inset-0 z-[100] bg-paper flex flex-col md:flex-row overflow-hidden"
    dir="rtl"
  >
    {/* Sidebar */}
    <div className="w-full md:w-72 bg-wine-dark text-white p-8 flex flex-col justify-between shrink-0">
      <div>
        <div className="flex items-center gap-4 mb-12">
          <Logo className="w-12 h-12" />
          <div>
            <div className="font-black text-lg">لوحة الإدارة</div>
            <div className="text-[10px] text-gold font-bold uppercase tracking-widest opacity-60">Control Center</div>
          </div>
        </div>
        <nav className="space-y-3">
          <button 
            onClick={() => setAdminTab('overview')}
            className={`flex items-center gap-3 w-full p-4 rounded-2xl font-bold transition-all ${adminTab === 'overview' ? 'bg-white/10 shadow-lg' : 'hover:bg-white/5 opacity-60'}`}
          >
            <LayoutDashboard size={20} /> نظرة عامة
          </button>
          <button 
            onClick={() => setAdminTab('products')}
            className={`flex items-center gap-3 w-full p-4 rounded-2xl font-bold transition-all ${adminTab === 'products' ? 'bg-white/10 shadow-lg' : 'hover:bg-white/5 opacity-60'}`}
          >
            <Package size={20} /> إدارة المنتجات
          </button>
          <button 
            onClick={() => setAdminTab('tenders')}
            className={`flex items-center gap-3 w-full p-4 rounded-2xl font-bold transition-all ${adminTab === 'tenders' ? 'bg-white/10 shadow-lg' : 'hover:bg-white/5 opacity-60'}`}
          >
            <Building2 size={20} /> طلبات الشركات
          </button>
          <button 
            onClick={() => setAdminTab('settings')}
            className={`flex items-center gap-3 w-full p-4 rounded-2xl font-bold transition-all ${adminTab === 'settings' ? 'bg-white/10 shadow-lg' : 'hover:bg-white/5 opacity-60'}`}
          >
            <Settings size={20} /> إعدادات الموقع
          </button>
        </nav>
      </div>
      
      <div className="space-y-4">
        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
          <div className="text-[10px] font-bold text-gold mb-1">حالة التعديل</div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold">{isAdminMode ? "وضع التعديل نشط" : "عرض فقط"}</span>
            <div className={`w-2 h-2 rounded-full ${isAdminMode ? "bg-green-400 animate-pulse" : "bg-white/20"}`}></div>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center justify-center gap-3 w-full p-4 bg-white text-wine-dark rounded-2xl font-black hover:bg-gold hover:text-ink transition-all shadow-xl"
        >
          <LogOut size={20} /> خروج للموقع العام
        </button>
      </div>
    </div>

    {/* Main Content */}
    <div className="flex-1 overflow-y-auto bg-paper p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h2 className="text-4xl font-black text-ink">
              {adminTab === 'overview' && 'مرحباً بك، مدير النظام'}
              {adminTab === 'products' && 'إدارة إعلانات المنتجات'}
              {adminTab === 'tenders' && 'طلبات توريد الشركات'}
              {adminTab === 'settings' && 'إعدادات المنصة'}
            </h2>
            <p className="text-muted mt-2 font-medium">تحكم في كافة محتويات الموقع وتواصل مع عملائك بسهولة.</p>
          </div>
          <div className="flex items-center gap-4">
            {isAdminMode ? (
              <>
                <button 
                  onClick={handleSaveAll}
                  className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black bg-wine text-white shadow-2xl transition-all transform active:scale-95 hover:bg-wine-dark"
                >
                  <Save size={22} /> حفظ التغييرات
                </button>
                <button 
                  onClick={handleCancelChanges}
                  className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black bg-paper border border-line text-ink transition-all hover:bg-white"
                >
                  <X size={22} /> إلغاء
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsAdminMode(true)}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black bg-gold text-ink shadow-2xl transition-all transform active:scale-95 hover:shadow-gold/20"
              >
                <Edit2 size={22} /> تفعيل وضع التعديل المباشر
              </button>
            )}
          </div>
        </header>

        {adminTab === 'overview' && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="bg-white p-8 rounded-[32px] border border-line shadow-sm">
                <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-2">إجمالي المخزون</div>
                <div className="text-5xl font-black text-wine">{tempProducts.length}</div>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-line shadow-sm">
                <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-2">المنتجات المباعة</div>
                <div className="text-5xl font-black text-gold">{tempProducts.filter(p => p.isSold).length}</div>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-line shadow-sm">
                <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-2">طلبات النشاط</div>
                <div className="text-5xl font-black text-[#2D5A27]">0</div>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-line shadow-sm">
                <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-2">زيارات اليوم</div>
                <div className="text-5xl font-black text-ink">12</div>
              </div>
            </div>
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white p-10 rounded-[40px] border border-line">
                <h3 className="text-2xl font-black mb-6">آخر الطلبات</h3>
                <div className="text-center py-10 opacity-30 font-bold">لا يوجد طلبات جديدة حالياً</div>
              </div>
              <div className="bg-white p-10 rounded-[40px] border border-line">
                <h3 className="text-2xl font-black mb-6">إحصائيات البيع</h3>
                <div className="h-40 bg-paper rounded-3xl flex items-center justify-center text-muted font-bold">رسم بياني توضيحي</div>
              </div>
            </div>
          </>
        )}

        {adminTab === 'products' && (
          <section className="bg-white rounded-[40px] border border-line overflow-hidden shadow-sm">
            <div className="p-8 border-b border-line bg-paper flex justify-between items-center">
              <h3 className="font-black flex items-center gap-3">
                <Package size={20} className="text-wine" /> قائمة المنتجات الحالية
              </h3>
              <button onClick={() => setIsAddingProduct(true)} className="flex items-center gap-2 bg-wine text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-wine-dark transition-all shadow-xl shadow-wine/10 active:scale-95">
                <Plus size={20} /> إضافة منتج جديد
              </button>
            </div>
            
            {isAddingProduct && (
              <div className="p-8 bg-paper/50 border-b border-line animate-in fade-in slide-in-from-top-4">
                <div className="max-w-4xl mx-auto bg-white p-10 rounded-[32px] shadow-2xl border border-line">
                  <div className="flex justify-between items-center mb-10">
                    <h4 className="text-2xl font-black">تفاصيل المنتج الجديد</h4>
                    <button onClick={() => setIsAddingProduct(false)} className="p-2 hover:bg-paper rounded-full transition-all"><X size={24} /></button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-muted uppercase">اسم المنتج</label>
                      <input className="w-full bg-paper border border-line rounded-2xl px-6 py-4 font-bold outline-none focus:ring-4 focus:ring-wine/10" placeholder="مثلاً: Lenovo ThinkPad T14" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-muted uppercase">التصنيف</label>
                      <select className="w-full bg-paper border border-line rounded-2xl px-6 py-4 font-bold outline-none focus:ring-4 focus:ring-wine/10" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value as Category})}>
                        <option value="laptop">لابتوب</option>
                        <option value="desktop">مكتبي</option>
                        <option value="print">طابعة / ملحقات</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-muted uppercase">الحالة / التصنيف الفرعي</label>
                      <input className="w-full bg-paper border border-line rounded-2xl px-6 py-4 font-bold outline-none focus:ring-4 focus:ring-wine/10" placeholder="مثلاً: مستعمل ممتاز" value={newProduct.subCategory} onChange={e => setNewProduct({...newProduct, subCategory: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-muted uppercase">السعر (ر.س)</label>
                      <input type="number" className="w-full bg-paper border border-line rounded-2xl px-6 py-4 font-bold outline-none focus:ring-4 focus:ring-wine/10" placeholder="0" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseInt(e.target.value)})} />
                    </div>
                    <div className="md:col-span-2 space-y-3">
                      <label className="text-[10px] font-black text-muted uppercase">المواصفات الفنية</label>
                      <textarea rows={2} className="w-full bg-paper border border-line rounded-2xl px-6 py-4 font-bold outline-none focus:ring-4 focus:ring-wine/10 resize-none" placeholder="i7 / 16GB / 512GB SSD..." value={newProduct.specs} onChange={e => setNewProduct({...newProduct, specs: e.target.value})} />
                    </div>
                    <div className="md:col-span-2 space-y-3">
                      <label className="text-[10px] font-black text-muted uppercase">صورة المنتج</label>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center justify-center gap-2 w-full bg-paper border-2 border-dashed border-line rounded-2xl p-6 cursor-pointer hover:border-wine/30 hover:bg-wine/5 transition-all">
                            <Upload size={20} className="text-wine" />
                            <span className="font-bold text-sm">رفع ملف صورة</span>
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setNewProduct({...newProduct, icon: reader.result as string});
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }} 
                            />
                          </label>
                          <div className="text-[10px] text-muted text-center italic">أو الصق رابط الصورة أدناه</div>
                        </div>
                        {newProduct.icon && (
                          <div className="relative w-full h-24 bg-paper rounded-2xl overflow-hidden border border-line">
                            <img src={newProduct.icon} className="w-full h-full object-cover" alt="Preview" />
                            <button 
                              onClick={() => setNewProduct({...newProduct, icon: ''})}
                              className="absolute top-2 left-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                      <input className="w-full mt-2 bg-paper border border-line rounded-2xl px-6 py-4 font-bold outline-none focus:ring-4 focus:ring-wine/10" placeholder="https://رابط-الصورة-هنا..." value={newProduct.icon} onChange={e => setNewProduct({...newProduct, icon: e.target.value})} />
                    </div>
                  </div>
                  <button onClick={addProduct} className="w-full mt-10 bg-wine text-white py-5 rounded-2xl font-black text-lg hover:bg-wine-dark shadow-xl transition-all active:scale-95">إضافة المنتج للمخزن</button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead className="bg-paper text-muted text-[10px] font-black uppercase tracking-widest border-b border-line">
                  <tr>
                    <th className="p-6">المنتج المعروض</th>
                    <th className="p-6">التصنيف الفني</th>
                    <th className="p-6">السعر</th>
                    <th className="p-6">الحالة</th>
                    <th className="p-6 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="font-bold">
                  {tempProducts.map(p => (
                    <tr key={p.id} className="border-b border-line hover:bg-paper/30 transition-colors">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <img src={p.icon} className="w-14 h-14 rounded-2xl object-cover shadow-sm" alt="" />
                          <div>
                            {isAdminMode ? (
                              <input className="bg-paper border-none outline-none rounded p-1" value={p.name} onChange={(e) => {
                                const n = [...tempProducts];
                                n.find(x => x.id === p.id)!.name = e.target.value;
                                setTempProducts(n);
                              }} />
                            ) : (
                              <div className="text-ink">{p.name}</div>
                            )}
                            <div className="text-[10px] text-muted">{p.specs}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 text-sm text-muted">{p.subCategory}</td>
                      <td className="p-6">
                        {isAdminMode ? (
                          <div className="flex items-center">
                            <span className="ml-1">ر.س</span>
                            <input type="number" className="w-20 bg-paper border-none outline-none rounded p-1" value={p.price} onChange={(e) => {
                              const n = [...tempProducts];
                              n.find(x => x.id === p.id)!.price = parseInt(e.target.value);
                              setTempProducts(n);
                            }} />
                          </div>
                        ) : (
                          <span>{p.price} ر.س</span>
                        )}
                      </td>
                      <td className="p-6">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase ${p.isSold ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                          {p.isSold ? 'تم البيع' : 'متوفر'}
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={() => {
                            const n = [...tempProducts];
                            const found = n.find(x => x.id === p.id);
                            if (found) found.isSold = !found.isSold;
                            setTempProducts(n);
                          }} className={`p-3 rounded-2xl transition-all ${p.isSold ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                            {p.isSold ? <TrendingUp size={18} /> : <ShieldCheck size={18} />}
                          </button>
                          <button onClick={() => setTempProducts(prev => prev.filter(x => x.id !== p.id))} className="p-3 bg-paper rounded-2xl hover:bg-red-600 hover:text-white transition-all">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {adminTab === 'tenders' && (
          <section className="bg-white rounded-[40px] border border-line overflow-hidden shadow-sm">
            <div className="p-8 border-b border-line bg-paper">
              <h3 className="font-black flex items-center gap-3">
                <Building2 size={20} className="text-wine" /> طلبات الشركات والمناقصات
              </h3>
            </div>
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-paper rounded-full flex items-center justify-center mx-auto mb-6 text-muted">
                <Building2 size={32} />
              </div>
              <h4 className="text-2xl font-black mb-4">لا يوجد طلبات تجارية حالياً</h4>
              <p className="text-muted font-bold max-w-sm mx-auto">سيتم عرض كافة طلبات عروض الأسعار التي تصل من خلال نموذج عروض الشركات هنا.</p>
            </div>
          </section>
        )}

        {adminTab === 'settings' && (
          <div className="grid lg:grid-cols-2 gap-8">
            <section className="bg-white rounded-[40px] border border-line overflow-hidden shadow-sm">
              <div className="p-8 border-b border-line bg-paper flex items-center gap-3">
                <Info size={20} className="text-wine" />
                <h3 className="font-black">معلومات المؤسسة والتواصل</h3>
              </div>
              <div className="p-10 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase">اسم المؤسسة</label>
                    <input className="w-full bg-paper border border-line rounded-2xl px-6 py-4 font-bold outline-none focus:ring-4 focus:ring-wine/10" value={tempSiteConfig.name} onChange={(e) => setTempSiteConfig({...tempSiteConfig, name: e.target.value})} disabled={!isAdminMode} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase">رقم الجوال</label>
                    <input className="w-full bg-paper border border-line rounded-2xl px-6 py-4 font-bold outline-none focus:ring-4 focus:ring-wine/10" value={tempSiteConfig.phone} onChange={(e) => setTempSiteConfig({...tempSiteConfig, phone: e.target.value})} disabled={!isAdminMode} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase">الموقع الجغرافي</label>
                  <input className="w-full bg-paper border border-line rounded-2xl px-6 py-4 font-bold outline-none focus:ring-4 focus:ring-wine/10" value={tempSiteConfig.location} onChange={(e) => setTempSiteConfig({...tempSiteConfig, location: e.target.value})} disabled={!isAdminMode} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase">البريد الإلكتروني</label>
                  <input className="w-full bg-paper border border-line rounded-2xl px-6 py-4 font-bold outline-none focus:ring-4 focus:ring-wine/10" value={tempSiteConfig.email} onChange={(e) => setTempSiteConfig({...tempSiteConfig, email: e.target.value})} disabled={!isAdminMode} />
                </div>
              </div>
            </section>

            <section className="bg-white rounded-[40px] border border-line overflow-hidden shadow-sm">
              <div className="p-8 border-b border-line bg-paper flex items-center gap-3">
                <Edit2 size={20} className="text-wine" />
                <h3 className="font-black">تعديل نصوص الصفحة الرئيسية</h3>
              </div>
              <div className="p-10 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase">وصف العرض الأول (Description)</label>
                  <textarea rows={3} className="w-full bg-paper border border-line rounded-2xl px-6 py-4 font-bold outline-none focus:ring-4 focus:ring-wine/10 resize-none" value={tempSiteConfig.description} onChange={(e) => setTempSiteConfig({...tempSiteConfig, description: e.target.value})} disabled={!isAdminMode} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase">من نحن (About Text)</label>
                  <textarea rows={5} className="w-full bg-paper border border-line rounded-2xl px-6 py-4 font-bold outline-none focus:ring-4 focus:ring-wine/10 resize-none" value={tempSiteConfig.aboutText} onChange={(e) => setTempSiteConfig({...tempSiteConfig, aboutText: e.target.value})} disabled={!isAdminMode} />
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  </motion.div>
);

const AdminLogin = ({ onLogin, onClose }: { onLogin: () => void; onClose: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // 1. Local Check (Priority - as requested "in the code")
    const authorizedEmails = ['abdulrahmannabudaqqa@gmail.com', 'aboudfdgreat@gmail.com'];
    if (authorizedEmails.includes(email) && password === '81#aboud81') {
      try {
        // 2. Try Firebase Auth (to make Firestore rules work)
        await signInWithEmailAndPassword(auth, email, password);
        onLogin();
      } catch (err: any) {
        console.error('Firebase Auth Attempt:', err);
        if (err.code === 'auth/operation-not-allowed') {
          // Bypass Firebase Auth for the UI but warn about the database
          onLogin();
          alert('تنبيه: تم تسجيل الدخول يدوياً (محلياً). للتمكن من تعديل البيانات في قاعدة البيانات، يجب تفعيل (Email/Password) في إعدادات Firebase.');
        } else if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
          // Attempt to create user if they match the hardcoded credentials
          try {
            await createUserWithEmailAndPassword(auth, email, password);
            onLogin();
          } catch (createErr) {
            // Last resort: Local login only
            onLogin();
            alert('تم الدخول يدوياً. لم نتمكن من ربط الجساب بقاعدة البيانات (تأكد من إعدادات Firebase).');
          }
        } else {
          setError('حدث خطأ: ' + err.message);
        }
      }
    } else {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;
      
      const authorizedEmails = ['abdulrahmannabudaqqa@gmail.com', 'aboudfdgreat@gmail.com'];
      if (!email || !authorizedEmails.includes(email)) {
        await signOut(auth);
        setError('عذراً، هذا البريد ليس له صلاحيات إدارية');
      } else {
        onLogin();
      }
    } catch (err: any) {
      console.error(err);
      setError('حدث خطأ أثناء تسجيل الدخول عبر Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-ink/90 backdrop-blur-md flex items-center justify-center p-6"
      dir="rtl"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-full h-2 bg-wine"></div>
        <button onClick={onClose} className="absolute top-6 left-6 p-2 hover:bg-paper rounded-full transition-all">
          <X size={24} />
        </button>
        
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-wine/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Lock size={32} className="text-wine" />
          </div>
          <h2 className="text-3xl font-black text-ink mb-2">دخول الإدارة</h2>
          <p className="text-muted font-bold text-sm">يرجى إدخال بيانات الاعتماد للوصول للوحة التحكم</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-right">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest mr-2 block">البريد الإلكتروني</label>
            <input 
              type="email" 
              required
              className="w-full bg-paper border border-line rounded-2xl px-6 py-4 font-bold outline-none focus:ring-4 focus:ring-wine/10 transition-all text-right"
              placeholder="example@mail.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest mr-2 block">كلمة المرور</label>
            <input 
              type="password" 
              required
              className="w-full bg-paper border border-line rounded-2xl px-6 py-4 font-bold outline-none focus:ring-4 focus:ring-wine/10 transition-all text-right"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold text-center"
            >
              {error}
            </motion.div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-wine text-white py-5 rounded-2xl font-black text-lg hover:bg-wine-dark shadow-xl shadow-wine/20 transition-all active:scale-[0.98] flex items-center justify-center"
          >
            {loading ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : 'تسجيل الدخول'}
          </button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-line"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted font-bold">أو</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white border-2 border-line text-ink py-4 rounded-2xl font-black text-sm hover:bg-paper transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12.48 10.92v3.28h7.84c-.24 1.84-1.92 5.36-7.84 5.36-5.12 0-9.28-4.24-9.28-9.52s4.16-9.52 9.28-9.52c2.92 0 4.88 1.24 6 2.32l2.6-2.52C19.12 1.36 16.04 0 12.48 0 5.6 0 0 5.6 0 12.48s5.6 12.48 12.48 12.48c7.2 0 12-5.08 12-12.2 0-.84-.08-1.48-.2-2.12h-11.8z"/>
            </svg>
            الدخول السريع عبر Google
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};


export default function App() {
  const [activeFilter, setActiveFilter] = useState<Category>('all');
  const [isAdminView, setIsAdminView] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminTab, setAdminTab] = useState<'overview' | 'products' | 'tenders' | 'settings'>('overview');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(INITIAL_SITE_CONFIG);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [tempSiteConfig, setTempSiteConfig] = useState<SiteConfig>(INITIAL_SITE_CONFIG);
  const [tempProducts, setTempProducts] = useState<Product[]>([]);
  
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    category: 'laptop',
    subCategory: '',
    specs: '',
    price: 0,
    icon: '',
    isSold: false
  });

  const [scrolled, setScrolled] = useState(false);

  // Sync Auth State
  useEffect(() => {
    const authorizedEmails = ['abdulrahmannabudaqqa@gmail.com', 'aboudfdgreat@gmail.com'];
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email && authorizedEmails.includes(user.email)) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync Site Config
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'site_config', 'main'), (snapshot) => {
      if (snapshot.exists()) {
        setSiteConfig(snapshot.data() as SiteConfig);
      }
    }, (error) => {
      console.error("Site Config Listener Error:", error);
    });
    return () => unsubscribe();
  }, []);

  // Sync Products
  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('id', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods: Product[] = [];
      snapshot.forEach((doc) => {
        prods.push({ ...doc.data() } as Product);
      });
      // Fallback to initial if empty
      if (prods.length === 0) {
        setProducts(INITIAL_PRODUCTS);
      } else {
        setProducts(prods);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAdminView) {
      setTempSiteConfig(siteConfig);
      setTempProducts(products);
    }
  }, [isAdminView, siteConfig, products]);

  const handleSaveAll = async () => {
    try {
      // Save Site Config
      await setDoc(doc(db, 'site_config', 'main'), tempSiteConfig);
      
      // Save Products (This app's logic seems to overwrite the whole list or manage it locally)
      // For proper Firestore, we should add/update individual docs.
      // But since we have a list in state, we'll sync the changes.
      
      // 1. Identify new or updated products
      for (const prod of tempProducts) {
        await setDoc(doc(db, 'products', prod.id), prod);
      }
      
      // 2. Handle deletions (compare products and tempProducts)
      const currentIds = new Set(tempProducts.map(p => p.id));
      const deletedProds = products.filter(p => !currentIds.has(p.id));
      for (const prod of deletedProds) {
        await deleteDoc(doc(db, 'products', prod.id));
      }

      setIsAdminMode(false);
      alert('تم حفظ كافة التغييرات بنجاح ✓');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'batch-save');
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  const handleCancelChanges = () => {
    setTempSiteConfig(siteConfig);
    setTempProducts(products);
    setIsAdminMode(false);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredProducts = products.filter(p => activeFilter === 'all' || p.category === activeFilter);

  const addProduct = () => {
    if (!newProduct.name || !newProduct.price) {
      alert('يرجى إكمال بيانات المنتج الأساسية');
      return;
    }
    const p: Product = {
      id: Math.random().toString(36).substr(2, 9),
      name: newProduct.name || '',
      category: newProduct.category || 'laptop',
      subCategory: newProduct.subCategory || 'إضافة جديدة',
      specs: newProduct.specs || '',
      price: Number(newProduct.price) || 0,
      isSold: false,
      icon: newProduct.icon || 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop&q=60'
    };
    setTempProducts([p, ...tempProducts]);
    setIsAddingProduct(false);
    setNewProduct({
      name: '',
      category: 'laptop',
      subCategory: '',
      specs: '',
      price: 0,
      icon: '',
      isSold: false
    });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAdminView(false);
      setIsAdminMode(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen font-sans text-right tech-bg" dir="rtl">
      <AnimatePresence>
        {isAdminView && !isLoggedIn && (
          <AdminLogin 
            onLogin={() => setIsLoggedIn(true)} 
            onClose={() => setIsAdminView(false)} 
          />
        )}
        {isAdminView && isLoggedIn && (
          <AdminDashboard 
            adminTab={adminTab}
            setAdminTab={setAdminTab}
            isAdminMode={isAdminMode}
            setIsAdminMode={setIsAdminMode}
            setIsAdminView={setIsAdminView}
            tempSiteConfig={tempSiteConfig}
            setTempSiteConfig={setTempSiteConfig}
            tempProducts={tempProducts}
            setTempProducts={setTempProducts}
            handleSaveAll={handleSaveAll}
            handleCancelChanges={handleCancelChanges}
            isAddingProduct={isAddingProduct}
            setIsAddingProduct={setIsAddingProduct}
            newProduct={newProduct}
            setNewProduct={setNewProduct}
            addProduct={addProduct}
            setIsLoggedIn={setIsLoggedIn}
            handleLogout={handleLogout}
          />
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div className="bg-wine-dark text-white text-[10px] md:text-xs py-2.5 overflow-hidden font-bold">
        <div className="container mx-auto px-6 flex justify-between items-center whitespace-nowrap overflow-x-auto gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <span className="bg-gold text-ink px-2 py-0.5 rounded uppercase tracking-[0.2em]">{siteConfig.name}</span>
          </div>
          <div className="flex items-center gap-6 md:gap-10 opacity-90 shrink-0">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-gold" />
              <span>{siteConfig.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-gold" />
              <span>{siteConfig.phone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className={`sticky top-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white shadow-2xl' : 'bg-white/80 backdrop-blur-xl border-b border-line'}`}>
        <div className="container mx-auto px-6 h-20 md:h-28 flex items-center justify-between">
          <a href="#" className="flex items-center gap-4 group">
            <Logo />
            <div className="flex flex-col">
              <span className="text-xl md:text-2xl font-black tracking-tighter text-ink group-hover:text-wine transition-colors leading-none">النجم الساحلي</span>
              <span className="text-[10px] text-muted font-black tracking-widest mt-1 opacity-60 uppercase">STAR COAST TECH</span>
            </div>
          </a>

          <nav className="hidden lg:flex items-center gap-10 font-black text-muted uppercase text-[10px] tracking-[0.2em]">
            <a href="#products" className="hover:text-wine transition-all hover:tracking-[0.3em]">المنتجات</a>
            <a href="#business" className="hover:text-wine transition-all hover:tracking-[0.3em]">عروض الشركات</a>
            <a href="#about" className="hover:text-wine transition-all hover:tracking-[0.3em]">من نحن</a>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsAdminView(true)}
              className="group relative overflow-hidden bg-paper text-ink border border-line px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-wine transition-all flex items-center gap-2"
            >
              <LayoutDashboard size={14} /> الإدارة
            </button>
            <a href="#products" className="hidden sm:flex bg-wine text-white px-8 py-3.5 rounded-2xl font-black text-xs hover:bg-wine-dark transition-all shadow-2xl shadow-wine/20 items-center gap-2">
              اطلب جهازك
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="hero-gradient py-20 md:py-36 overflow-hidden relative">
          <div className="container mx-auto px-6 grid md:grid-cols-2 gap-20 items-center relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/50 backdrop-blur-md text-wine rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-10 border border-line shadow-sm">
                <span className="text-gold">✦</span>
                مؤسسة النجم الساحلي لخدمات الحاسب
              </div>
              <h1 className="text-5xl md:text-7xl font-black leading-[1.1] mb-8 text-ink tracking-tighter">
                بوابتكم لامتلاك <br />
                أقوى <span className="text-wine">الحواسيب</span> <br />
                <span className="text-[#2D5A27]">وأجهزة الطباعة</span>.
              </h1>
              <p className="text-xl text-muted max-w-lg mb-12 leading-relaxed font-bold opacity-80">
                {siteConfig.description}
              </p>
              <div className="flex flex-wrap gap-6 items-center">
                <a href="#products" className="bg-wine text-white px-10 py-5 rounded-[24px] font-black hover:bg-wine-dark transition-all transform hover:-translate-y-2 shadow-[0_20px_40px_-10px_rgba(125,29,60,0.4)]">
                  ابدأ التسوق الآن
                </a>
                <a href="#business" className="bg-white/80 backdrop-blur-md text-ink border border-line px-10 py-5 rounded-[24px] font-black hover:bg-paper transition-all flex items-center gap-3">
                  عروض الشركات <ChevronLeft size={20} />
                </a>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="relative"
            >
              <div className="aspect-square bg-white rounded-[60px] p-5 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] relative z-10 border border-line overflow-hidden group">
                <img 
                  src="https://images.unsplash.com/photo-1547082299-de196ea013d6?w=1200&auto=format&fit=crop&q=80" 
                  className="w-full h-full object-cover rounded-[45px] transition-transform duration-1000 group-hover:scale-110" 
                  alt="Tech Hero" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-12 right-12 left-12 p-10 bg-white/90 backdrop-blur-2xl rounded-[32px] border border-line shadow-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="text-xs font-black text-wine uppercase tracking-widest">متاح حالياً في المتجر</div>
                  </div>
                  <div className="text-sm text-muted font-black leading-relaxed">أحدث أجهزة الـ Workstation والطابعات لبيئات العمل الاحترافية بضمان حقيقي.</div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Row */}
        <section className="py-16 bg-white border-y border-line">
          <div className="container mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { icon: ShieldCheck, title: 'ضمان تشغيل', desc: 'فحص فني شامل' },
              { icon: TrendingUp, title: 'أسعار الجملة', desc: 'أفضل قيمة بالسوق' },
              { icon: Building2, title: 'توريد معتمد', desc: 'للشركات والمناقصات' },
              { icon: CheckCircle2, title: 'دعم فني', desc: 'خدمة ما بعد البيع' }
            ].map((item, i) => (
              <div key={i} className="flex flex-col md:flex-row items-center md:items-start text-center md:text-right gap-5 group">
                <div className="w-16 h-16 bg-wine/5 text-wine rounded-[24px] flex items-center justify-center shrink-0 group-hover:bg-wine group-hover:text-white transition-all duration-500 shadow-sm">
                  <item.icon size={28} />
                </div>
                <div className="flex flex-col justify-center">
                  <div className="font-black text-lg text-ink">{item.title}</div>
                  <div className="text-xs text-muted font-bold tracking-widest mt-1 opacity-60 uppercase">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Products Section */}
        <section id="products" className="py-32 bg-paper relative">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-20">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-1.5 bg-wine rounded-full"></div>
                  <span className="text-wine text-[10px] font-black uppercase tracking-[0.4em]">Product Catalog</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-ink tracking-tighter">أحدث الإصدارات بالمخزن</h2>
                <p className="text-muted mt-5 text-lg font-bold leading-relaxed opacity-70">نختار أجهزتنا بعناية لضمان أداء استثنائي لعملائنا في كافة المجالات البرمجية والتصميمية.</p>
              </div>
              
              <div className="flex flex-wrap gap-3 bg-white p-2 rounded-[30px] border border-line shadow-sm">
                {(['all', 'laptop', 'desktop', 'print'] as Category[]).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveFilter(cat)}
                    className={`px-10 py-4 rounded-[22px] text-xs font-black transition-all uppercase tracking-widest ${
                      activeFilter === cat 
                        ? 'bg-wine text-white shadow-[0_15px_30px_-5px_rgba(125,29,60,0.3)] scale-105' 
                        : 'text-muted hover:bg-paper'
                    }`}
                  >
                    {cat === 'all' ? 'الكل' : 
                     cat === 'laptop' ? 'لابتوبات' : 
                     cat === 'desktop' ? 'أجهزة مكتبية' : 'طابعات'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
              <AnimatePresence mode='popLayout'>
                {filteredProducts.map(product => (
                  <motion.article 
                    layout
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`group relative bg-white rounded-[45px] overflow-hidden border border-line hover:border-wine/20 transition-all duration-500 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] hover:-translate-y-4 ${product.isSold ? 'grayscale' : ''}`}
                  >
                    <div className="aspect-[16/11] relative overflow-hidden bg-paper">
                      {product.isSold && (
                        <div className="absolute inset-0 bg-ink/60 z-20 flex items-center justify-center backdrop-blur-md">
                          <div className="bg-white text-ink px-10 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl">نفذت الكمية</div>
                        </div>
                      )}
                      <img 
                        src={product.icon} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                      <div className="absolute top-6 left-6 z-10">
                        <span className="px-4 py-1.5 bg-white/95 backdrop-blur-md text-wine text-[10px] font-black rounded-xl shadow-xl border border-line uppercase tracking-widest">
                          {product.subCategory}
                        </span>
                      </div>
                    </div>
                    <div className="p-10">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2 text-gold">
                          <div className="w-2 h-2 bg-gold rounded-full animate-pulse"></div>
                          <span className="text-[10px] font-black uppercase tracking-widest">Premium Grade</span>
                        </div>
                        <div className="text-3xl font-black text-wine tracking-tighter">ر.س {product.price.toLocaleString()}</div>
                      </div>
                      <h3 className="text-2xl font-black mb-4 text-ink group-hover:text-wine transition-colors leading-tight">
                        {product.name}
                      </h3>
                      <div className="p-5 bg-paper rounded-[24px] border border-line group-hover:bg-wine/5 group-hover:border-wine/10 transition-all mb-8">
                        <div className="flex items-center gap-3 text-muted">
                          <Monitor size={18} className="text-gold" />
                          <span className="text-sm font-bold leading-relaxed">{product.specs}</span>
                        </div>
                      </div>
                      
                      <button className={`w-full py-5 rounded-[22px] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${
                        product.isSold 
                        ? 'bg-paper text-muted cursor-not-allowed border border-line' 
                        : 'bg-wine text-white hover:bg-wine-dark shadow-wine/20 active:scale-95'
                      }`}>
                        {product.isSold ? 'تم البيع بنجاح' : 'طلب الجهاز الآن'}
                        {!product.isSold && <ArrowRight size={20} />}
                      </button>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Business Section */}
        <section id="business" className="py-36 bg-ink text-white relative overflow-hidden">
          <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-24 items-center">
            <div>
              <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/5 rounded-full border border-white/10 mb-10">
                <div className="w-2 h-2 bg-gold rounded-full animate-pulse"></div>
                <span className="text-gold text-[10px] font-black uppercase tracking-[0.4em]">Corporate Partnership</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-black mb-10 leading-[1.1] tracking-tighter">نقلة تقنية <br />لمؤسستكم.</h2>
              <p className="text-blush/50 text-xl mb-12 leading-relaxed font-bold">
                نوفر لقطاع الأعمال خدمات لوجستية وتقنية متكاملة. نشتري أجهزتكم القديمة بعقود استبدال مجزية، ونورد لكم أحدث الحلول التقنية بضمانات مؤسسية معتمدة.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-8">
                {[
                  { icon: Trash2, title: 'شراء الرجيع التقني', desc: 'نشتري أجهزتكم القديمة بأفضل تقييم.' },
                  { icon: Building2, title: 'توريد حكومي وأهلي', desc: 'تجهيز كامل للمكاتب والمناقصات.' },
                  { icon: ShieldCheck, title: 'عقود ضمان ممددة', desc: 'حماية لاستثماراتكم التقنية.' },
                  { icon: Mail, title: 'فواتير ضريبية', desc: 'نظام مالي وقانوني متكامل.' }
                ].map((feat, i) => (
                  <div key={i} className="p-8 bg-white/5 rounded-[32px] border border-white/10 hover:bg-white/10 transition-all group">
                    <feat.icon className="text-gold mb-6 group-hover:scale-125 transition-transform duration-500" size={32} />
                    <div className="font-black text-xl mb-3">{feat.title}</div>
                    <div className="text-sm text-blush/30 leading-relaxed font-bold">{feat.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[60px] p-12 md:p-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] text-ink relative">
              <h3 className="text-3xl font-black mb-3">اطلب عرض سعر رسمي</h3>
              <p className="text-muted text-sm mb-12 font-bold opacity-70">سيتواصل معكم مستشار المبيعات خلال ساعات عمل المؤسسة الرسمية.</p>
              
              <form className="space-y-8" onSubmit={async (e) => { 
                e.preventDefault(); 
                const form = e.currentTarget;
                const companyName = (form.elements[0] as HTMLInputElement).value;
                const contact = (form.elements[1] as HTMLInputElement).value;
                const requestType = (form.elements[2] as HTMLSelectElement).value;
                const details = (form.elements[3] as HTMLTextAreaElement).value;

                try {
                  await addDoc(collection(db, 'tenders'), {
                    companyName,
                    contact,
                    requestType,
                    details,
                    status: 'pending',
                    createdAt: new Date().toISOString()
                  });
                  alert('تم استلام طلبكم بنجاح ✓ سيتواصل معكم الفريق المختص قريباً.');
                  form.reset();
                } catch (error) {
                  console.error(error);
                  alert('حدث خطأ أثناء إرسال الطلب، يرجى المحاولة لاحقاً');
                }
              }}>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mr-2">جهة الطلب</label>
                    <input required type="text" className="w-full bg-paper border border-line rounded-[20px] px-8 py-5 outline-none focus:ring-4 focus:ring-wine/10 focus:border-wine transition-all font-black text-right" placeholder="اسم الشركة" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mr-2">رقم الجوال</label>
                    <input required type="text" className="w-full bg-paper border border-line rounded-[20px] px-8 py-5 outline-none focus:ring-4 focus:ring-wine/10 focus:border-wine transition-all font-black text-right" placeholder="05x xxx xxxx" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mr-2">نوع الطلب التجاري</label>
                  <select className="w-full bg-paper border border-line rounded-[20px] px-8 py-5 outline-none focus:ring-4 focus:ring-wine/10 focus:border-wine transition-all font-black appearance-none cursor-pointer text-right">
                    <option>بيع أجهزة قديمة للمؤسسة (Sell to us)</option>
                    <option>شراء وتوريد أجهزة مكتبية</option>
                    <option>تجهيز معامل كمبيوتر كاملة</option>
                    <option>مناقصة توريد طابعات ومحابر</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mr-2">وصف الاحتياج</label>
                  <textarea rows={4} className="w-full bg-paper border border-line rounded-[20px] px-8 py-5 outline-none focus:ring-4 focus:ring-wine/10 focus:border-wine transition-all font-black resize-none text-right" placeholder="اذكر الكميات والمواصفات المبدئية..."></textarea>
                </div>

                <button className="w-full bg-wine text-white py-6 rounded-[22px] font-black text-xl hover:bg-wine-dark transition-all transform active:scale-95 shadow-2xl shadow-wine/20 mt-6 flex items-center justify-center gap-4">
                  إرسال الطلب الآن <ChevronLeft size={28} />
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* About & Map Section */}
        <section id="about" className="py-40 bg-white">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-[0.7fr_1.3fr] gap-24 items-center mb-32">
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-paper p-16 rounded-[60px] border-r-[15px] border-gold shadow-sm"
              >
                <div className="text-9xl font-black text-wine leading-none tracking-tighter">10+</div>
                <div className="text-2xl font-black text-ink mt-6 leading-tight">عشر سنوات من الخبرة <br />في خدمة السوق السعودي</div>
              </motion.div>
              
              <div>
                <div className="inline-flex items-center gap-3 text-wine font-black text-[10px] uppercase tracking-[0.5em] mb-6 text-right">
                  <Logo className="w-6 h-6" /> القصة والرسالة
                </div>
                <h2 className="text-4xl md:text-6xl font-black mb-10 text-ink leading-tight tracking-tighter">الوضوح هو مبدأنا، <br />والجودة هي ضماننا.</h2>
                <p className="text-muted text-2xl leading-relaxed mb-12 font-bold italic opacity-80 text-right">
                  "{siteConfig.aboutText}"
                </p>
                <div className="flex flex-col sm:flex-row gap-10">
                  <div className="flex items-center gap-5 group">
                    <div className="w-20 h-20 bg-wine text-white rounded-[28px] flex items-center justify-center shadow-2xl shadow-wine/20 group-hover:scale-110 transition-transform duration-500 shrink-0">
                      <CheckCircle2 size={32} />
                    </div>
                    <div className="font-black text-ink text-xl">دعم فني متميز</div>
                  </div>
                  <div className="flex items-center gap-5 group">
                    <div className="w-20 h-20 bg-[#2D5A27] text-white rounded-[28px] flex items-center justify-center shadow-2xl shadow-[#2D5A27]/20 group-hover:scale-110 transition-transform duration-500 shrink-0">
                      <ShieldCheck size={32} />
                    </div>
                    <div className="font-black text-ink text-xl">فحص جودة معتمد</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-paper rounded-[60px] p-12 md:p-24 border border-line flex flex-col lg:flex-row items-center gap-16 shadow-inner">
              <div className="w-32 h-32 md:w-48 md:h-48 bg-white rounded-[45px] flex items-center justify-center text-wine shrink-0 shadow-2xl border border-line">
                <MapPin size={64} className="animate-bounce" />
              </div>
              <div className="text-center lg:text-right">
                <h3 className="text-4xl md:text-5xl font-black mb-6 tracking-tighter">زورونا في مقرنا الرئيسي</h3>
                <p className="text-2xl text-muted font-bold mb-10 leading-relaxed max-w-3xl">
                  يسعدنا استقبالكم في فرعنا بالرياض لفحص الأجهزة واستلام طلباتكم مباشرة.
                </p>
                <div className="flex flex-col sm:flex-row gap-10 items-center justify-center lg:justify-start">
                  <div className="flex items-center gap-4 p-5 bg-white rounded-3xl shadow-sm border border-line">
                    <div className="w-10 h-10 rounded-2xl bg-wine text-white flex items-center justify-center shrink-0">
                      <MapPin size={20} />
                    </div>
                    <span className="font-black text-ink">{siteConfig.location}</span>
                  </div>
                  <div className="flex items-center gap-4 p-5 bg-white rounded-3xl shadow-sm border border-line">
                    <div className="w-10 h-10 rounded-2xl bg-[#2D5A27] text-white flex items-center justify-center shrink-0">
                      <Phone size={20} />
                    </div>
                    <span className="font-black text-ink tracking-widest">{siteConfig.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-ink wine-pattern text-white py-24 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10 text-right">
          <div className="grid lg:grid-cols-[1.8fr_1fr_1.2fr] gap-24 pb-24 border-b border-white/5">
            <div>
              <div className="flex items-center justify-end gap-5 mb-10">
                <div className="flex flex-col text-right">
                  <span className="text-3xl font-black tracking-tighter leading-none">{siteConfig.name}</span>
                  <span className="text-gold text-[10px] font-black tracking-[0.4em] mt-1">ESTABLISHED FOR QUALITY</span>
                </div>
                <Logo />
              </div>
              <p className="text-blush/30 text-lg leading-relaxed max-w-md font-bold italic mr-auto">
                رواد حلول الحواسيب والطابعات في المملكة العربية السعودية منذ أكثر من عقد. نضع الجودة والشفافية في قلب كل ما نقدمه.
              </p>
            </div>
            
            <div>
              <h4 className="text-gold font-black text-xs uppercase tracking-[0.4em] mb-12">Navigation</h4>
              <nav className="flex flex-col gap-6 text-blush/50 font-black text-sm uppercase tracking-widest">
                <a href="#products" className="hover:text-white transition-all hover:-translate-x-3">المنتجات النشطة</a>
                <a href="#business" className="hover:text-white transition-all hover:-translate-x-3">حلول الشركات</a>
                <a href="#about" className="hover:text-white transition-all hover:-translate-x-3">عن المؤسسة</a>
                <a href="#" className="hover:text-white transition-all hover:-translate-x-3">سياسة الخصوصية</a>
              </nav>
            </div>

            <div>
              <h4 className="text-gold font-black text-xs uppercase tracking-[0.4em] mb-12">Connect With Us</h4>
              <div className="space-y-8">
                <div className="flex items-center justify-end gap-5 group cursor-pointer">
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-blush/20 font-black uppercase tracking-widest">Email Support</span>
                    <span className="text-blush/60 font-black">{siteConfig.email}</span>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-gold group-hover:bg-wine group-hover:text-white transition-all duration-500 shadow-xl">
                    <Mail size={24} />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-5 group cursor-pointer">
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-blush/20 font-black uppercase tracking-widest">Call Center</span>
                    <span className="text-blush/60 font-black tracking-[0.1em]">{siteConfig.phone}</span>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-gold group-hover:bg-[#2D5A27] group-hover:text-white transition-all duration-500 shadow-xl">
                    <Phone size={24} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center pt-12 text-[9px] text-blush/20 font-black uppercase tracking-[0.4em] gap-6">
            <div className="flex gap-10">
              <span className="hover:text-white cursor-pointer transition-colors">CORPORATE</span>
              <span className="hover:text-white cursor-pointer transition-colors">PRINTERS</span>
              <span className="hover:text-white cursor-pointer transition-colors">COMPUTERS</span>
            </div>
            <span>حقوق الطبع والنشر © 2026 {siteConfig.name}. كل الحقوق محفوظة.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
