import { supabase } from '../supabase';
import { Appointment, AppointmentStatus } from '../../types';

export async function getAppointments(startDate: Date, endDate: Date): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .gte('start_time', startDate.toISOString())
    .lte('start_time', endDate.toISOString())
    .order('start_time', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createAppointment(appointment: any): Promise<Appointment> {
  const { data, error } = await supabase
    .from('appointments')
    .insert([appointment])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export interface PublicAppointmentInput {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_birthday?: string;
  professional_id: string;
  service_id: string;
  start_time: string;
}

export interface BookedInterval {
  start_time: string;
  end_time: string;
}

export async function getPublicBookedIntervals(professionalId: string, date: string): Promise<BookedInterval[]> {
  const { data, error } = await supabase.rpc('get_public_booked_intervals', {
    professional_id_input: professionalId,
    date_input: date,
  });

  if (error) throw new Error(error.message);
  return (data || []) as BookedInterval[];
}

export async function createPublicAppointment(appointment: PublicAppointmentInput): Promise<Appointment> {
  const { data, error } = await supabase.rpc('book_appointment', {
    customer_name_input: appointment.customer_name,
    customer_phone_input: appointment.customer_phone,
    customer_email_input: appointment.customer_email || '',
    customer_birthday_input: appointment.customer_birthday || null,
    professional_id_input: appointment.professional_id,
    service_id_input: appointment.service_id,
    start_time_input: appointment.start_time,
  });

  if (error) throw new Error(error.message);
  return data as Appointment;
}

export async function updateAppointmentFull(id: string, updates: Partial<any>): Promise<void> {
  if (updates.status === 'completed') {
    // Persiste os ajustes feitos no formulário antes de gerar financeiro,
    // fidelidade e comissão a partir dos dados definitivos do atendimento.
    const { status: _status, id: _id, created_at: _createdAt, ...editableFields } = updates;
    void _status;
    void _id;
    void _createdAt;
    const { error: updateError } = await supabase
      .from('appointments')
      .update(editableFields)
      .eq('id', id);
    if (updateError) throw new Error(updateError.message);

    const { error } = await supabase.rpc('complete_appointment', { appointment_id_input: id });
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function deleteAppointment(id: string): Promise<void> {
  const { error } = await supabase.from('appointments').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
