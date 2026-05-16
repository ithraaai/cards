// =================================================================
// عميل Supabase
// =================================================================
// يُهيّئ الاتصال مع قاعدة البيانات السحابية.
// المفاتيح تُقرأ من متغيرات البيئة (آمن).
// =================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('⚠️ مفاتيح Supabase غير محددة في متغيرات البيئة');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// دالة للتحقق من الاتصال
export async function checkConnection() {
  try {
    const { data, error } = await supabase.from('settings').select('id').limit(1);
    if (error) throw error;
    return { connected: true };
  } catch (err) {
    console.error('فشل الاتصال بـ Supabase:', err);
    return { connected: false, error: err.message };
  }
}
