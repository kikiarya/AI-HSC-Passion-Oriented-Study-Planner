import { getSupabaseClient } from '../../clients/supabaseClient.js';
import { ErrorResponse } from '../../utils/errorResponse.js';

export const getClassModulesForStudent = async (req, res) => {
  try {
    const { classId } = req.params;
    const supabase = getSupabaseClient();

    const { data: modules, error: modErr } = await supabase
      .from('class_modules')
      .select('*')
      .eq('class_id', classId)
      .eq('is_published', true)
      .order('order_index', { ascending: true });
    if (modErr) return ErrorResponse.internalServerError('Failed to fetch modules').send(res);

    // Filter availability window in JS
    const now = new Date();
    const filtered = (modules || []).filter(m => {
      const fromOk = !m.available_from || new Date(m.available_from) <= now;
      const untilOk = !m.available_until || new Date(m.available_until) >= now;
      return fromOk && untilOk;
    });

    const moduleIds = filtered.map(m => m.id);
    let itemsByModule = {};
    if (moduleIds.length > 0) {
      const { data: items, error: itemErr } = await supabase
        .from('class_module_items')
        .select('*')
        .in('module_id', moduleIds)
        .order('order_index', { ascending: true });
      if (itemErr) return ErrorResponse.internalServerError('Failed to fetch module items').send(res);
      itemsByModule = (items || []).reduce((acc, it) => {
        (acc[it.module_id] = acc[it.module_id] || []).push(it);
        return acc;
      }, {});
    }

    const result = filtered.map(m => ({ ...m, items: itemsByModule[m.id] || [] }));
    res.status(200).json({ modules: result });
  } catch (err) {
    console.error('getClassModulesForStudent error:', err);
    return ErrorResponse.internalServerError('An error occurred while fetching modules').send(res);
  }
};

export const getModuleDetailForStudent = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const supabase = getSupabaseClient();
    const { data: moduleRow, error: modErr } = await supabase
      .from('class_modules')
      .select('*')
      .eq('id', moduleId)
      .single();
    if (modErr || !moduleRow) return ErrorResponse.notFound('Module not found').send(res);

    const { data: items, error: itemErr } = await supabase
      .from('class_module_items')
      .select('*')
      .eq('module_id', moduleId)
      .order('order_index', { ascending: true });
    if (itemErr) return ErrorResponse.internalServerError('Failed to fetch items').send(res);
    res.status(200).json({ module: { ...moduleRow, items: items || [] } });
  } catch (err) {
    console.error('getModuleDetailForStudent error:', err);
    return ErrorResponse.internalServerError('An error occurred while fetching module').send(res);
  }
};


