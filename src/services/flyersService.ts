import { supabase } from '../lib/supabase';

export interface Flyer {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CreateFlyerData {
  title: string;
  description?: string;
  image_url: string;
  link_url?: string;
  is_active?: boolean;
  order_index?: number;
}

export interface UpdateFlyerData {
  title?: string;
  description?: string;
  image_url?: string;
  link_url?: string;
  is_active?: boolean;
  order_index?: number;
}

// Obtener todos los flyers activos ordenados
export async function getActiveFlyers(): Promise<Flyer[]> {
  const { data, error } = await supabase
    .from('flyers')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error obteniendo flyers:', error);
    return [];
  }

  return data || [];
}

// Obtener todos los flyers (para admin)
export async function getAllFlyers(): Promise<Flyer[]> {
  const { data, error } = await supabase
    .from('flyers')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error obteniendo todos los flyers:', error);
    return [];
  }

  return data || [];
}

// Crear un nuevo flyer
export async function createFlyer(flyerData: CreateFlyerData): Promise<Flyer | null> {
  const { data, error } = await supabase
    .from('flyers')
    .insert([flyerData])
    .select()
    .single();

  if (error) {
    console.error('Error creando flyer:', error);
    return null;
  }

  return data;
}

// Actualizar un flyer
export async function updateFlyer(id: string, flyerData: UpdateFlyerData): Promise<Flyer | null> {
  const { data, error } = await supabase
    .from('flyers')
    .update(flyerData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error actualizando flyer:', error);
    return null;
  }

  return data;
}

// Eliminar un flyer
export async function deleteFlyer(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('flyers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error eliminando flyer:', error);
    return false;
  }

  return true;
}

// Subir imagen a Supabase Storage
export async function uploadFlyerImage(file: File): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `flyers/${fileName}`;

  // Usar el bucket 'flyers'
  let { error: uploadError } = await supabase.storage
    .from('flyers')
    .upload(filePath, file);

  // Si falla, intentar con otros buckets disponibles
  if (uploadError && uploadError.message.includes('Bucket not found')) {
    console.log('Bucket flyers no encontrado, intentando con bucket alternativo...');
    const { data: buckets } = await supabase.storage.listBuckets();
    console.log('Buckets disponibles:', buckets);
    if (buckets && buckets.length > 0) {
      const bucketName = buckets[0].name;
      console.log(`Usando bucket: ${bucketName}`);
      const { error: retryError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);
      if (retryError) {
        console.error('Error subiendo imagen al bucket alternativo:', retryError);
        return null;
      }
      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      return data.publicUrl;
    } else {
      console.error('No se encontraron buckets disponibles');
      return null;
    }
  }

  if (uploadError) {
    console.error('Error subiendo imagen:', uploadError);
    return null;
  }

  const { data } = supabase.storage
    .from('flyers')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// Función alternativa para convertir imagen a base64 (fallback)
export async function convertImageToBase64(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      console.error('Error convirtiendo imagen a base64');
      resolve(null);
    };
    reader.readAsDataURL(file);
  });
}

// Función para obtener URL de imagen con fallback
export async function getImageUrl(file: File): Promise<string | null> {
  // Intentar primero con Supabase Storage
  const storageUrl = await uploadFlyerImage(file);
  if (storageUrl) {
    return storageUrl;
  }

  // Si falla, usar base64 como fallback
  console.log('Usando base64 como fallback para la imagen');
  return await convertImageToBase64(file);
} 