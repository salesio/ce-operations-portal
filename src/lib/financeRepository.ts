import { getSupabaseClient, getSupabaseConfig, PAYMENT_PROOFS_BUCKET } from "./supabaseClient";
import {
  buildFinanceRowsFromSubmission,
  mapFinanceRecordToDashboard,
  mapSubmissionToDashboard
} from "./mappers";
import type { FinanceRecordRow, PublicGivingPayload } from "./types";

const PENDING = "Pendente de Verificação";

function sanitizeFileName(name: string) {
  return String(name || "proof").replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function uploadPaymentProof(
  file: File,
  submissionGroupId: string
): Promise<{ path: string; publicUrl: string } | null> {
  const client = getSupabaseClient();
  if (!client || !file) return null;

  const path = `${submissionGroupId}/${Date.now()}-${sanitizeFileName(file.name)}`;
  const { error } = await client.storage.from(PAYMENT_PROOFS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined
  });
  if (error) throw new Error(error.message);

  const { data } = client.storage.from(PAYMENT_PROOFS_BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function submitPublicGiving(
  submission: PublicGivingPayload,
  proofFile?: File | null
): Promise<{ submission: ReturnType<typeof mapSubmissionToDashboard>; financeRecords: ReturnType<typeof mapFinanceRecordToDashboard>[] }> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured");

  const groupId = submission.submission_group_id || `sg-${Date.now()}`;
  const submissionId = submission.id || crypto.randomUUID();
  const now = submission.created_at || new Date().toISOString();

  let proofPath = submission.comprovativo_path || "";
  let proofPublicUrl = submission.comprovativo_url || "";

  if (proofFile) {
    const uploaded = await uploadPaymentProof(proofFile, groupId);
    if (uploaded) {
      proofPath = uploaded.path;
      proofPublicUrl = uploaded.publicUrl;
    }
  }

  const submissionRow = {
    id: submissionId,
    submission_group_id: groupId,
    full_name: submission.nome_completo || submission.full_name || "Contributor",
    phone: submission.telefone || submission.phone || null,
    email: submission.email || null,
    church_id: submission.igreja_id || submission.church_id || null,
    church_name: submission.igreja_nome || submission.church_name || null,
    cell_group_id: submission.cell_group_id != null ? String(submission.cell_group_id) : null,
    cell_group_name: submission.cell_group_name || submission.grupo_de_celula || null,
    cell_id: submission.cell_id != null ? String(submission.cell_id) : null,
    cell_name: submission.cell_name || submission.celula || null,
    contributions: submission.contribuicoes || submission.contributions || [],
    total_amount: Number(submission.total_geral || submission.total_amount || 0),
    currency: submission.currency || "MZN",
    payment_method: submission.metodo_de_pagamento || submission.payment_method || null,
    payment_reference: submission.referencia_da_transaccao || submission.payment_reference || null,
    payment_date: submission.data_da_transferencia || submission.payment_date || now.slice(0, 10),
    proof_file_url: proofPublicUrl || null,
    proof_file_name: proofFile?.name || null,
    source: "public_website",
    status: PENDING,
    notes: submission.observacoes || submission.notes || null,
    created_at: now
  };

  const financeRows = buildFinanceRowsFromSubmission(
    { ...submission, id: submissionId, submission_group_id: groupId, created_at: now },
    proofPath,
    proofPublicUrl
  );

  const { error: submissionError } = await client.from("public_giving_submissions").insert(submissionRow);
  if (submissionError) throw new Error(submissionError.message);

  const { data: insertedFinance, error: financeError } = await client
    .from("finance_records")
    .insert(financeRows)
    .select("*");
  if (financeError) throw new Error(financeError.message);

  return {
    submission: mapSubmissionToDashboard(submissionRow as never),
    financeRecords: (insertedFinance as FinanceRecordRow[]).map(mapFinanceRecordToDashboard)
  };
}

export async function fetchFinanceSnapshot(churchIds?: string[]) {
  const client = getSupabaseClient();
  if (!client) return null;

  let financeQuery = client.from("finance_records").select("*").order("created_at", { ascending: false });
  let submissionQuery = client.from("public_giving_submissions").select("*").order("created_at", { ascending: false });

  if (churchIds?.length) {
    financeQuery = financeQuery.in("church_id", churchIds);
    submissionQuery = submissionQuery.in("church_id", churchIds);
  }

  const [{ data: finance, error: financeError }, { data: submissions, error: submissionError }] = await Promise.all([
    financeQuery,
    submissionQuery
  ]);

  if (financeError) throw new Error(financeError.message);
  if (submissionError) throw new Error(submissionError.message);

  return {
    finance: (finance as FinanceRecordRow[]).map(mapFinanceRecordToDashboard),
    publicGivingSubmissions: (submissions || []).map(mapSubmissionToDashboard).filter(Boolean)
  };
}

export async function updateFinanceRecordStatus(
  recordId: string,
  patch: {
    estado: string;
    verificado_por: string;
    verified_at: string;
    comentario_verificacao?: string;
    motivo_rejeicao?: string;
    updated_by: string;
    updated_at: string;
  }
) {
  const client = getSupabaseClient();
  if (!client) return false;

  const { error } = await client.from("finance_records").update({
    estado: patch.estado,
    verificado_por: patch.verificado_por,
    verified_at: patch.verified_at,
    comentario_verificacao: patch.comentario_verificacao || null,
    motivo_rejeicao: patch.motivo_rejeicao || null,
    updated_by: patch.updated_by,
    updated_at: patch.updated_at
  }).eq("id", recordId);

  if (error) throw new Error(error.message);
  return true;
}

export async function updateFinanceGroupStatus(
  submissionGroupId: string,
  patch: {
    estado: string;
    verificado_por: string;
    verified_at: string;
    comentario_verificacao?: string;
    motivo_rejeicao?: string;
    updated_by: string;
    updated_at: string;
    submissionStatus: string;
  }
) {
  const client = getSupabaseClient();
  if (!client) return false;

  const { error: financeError } = await client.from("finance_records").update({
    estado: patch.estado,
    verificado_por: patch.verificado_por,
    verified_at: patch.verified_at,
    comentario_verificacao: patch.comentario_verificacao || null,
    motivo_rejeicao: patch.motivo_rejeicao || null,
    updated_by: patch.updated_by,
    updated_at: patch.updated_at
  }).eq("submission_group_id", submissionGroupId);

  if (financeError) throw new Error(financeError.message);

  const { error: submissionError } = await client.from("public_giving_submissions").update({
    status: patch.submissionStatus,
    updated_at: patch.updated_at
  }).eq("submission_group_id", submissionGroupId);

  if (submissionError) throw new Error(submissionError.message);
  return true;
}

export async function signInWithEmail(email: string, password: string) {
  const client = getSupabaseClient();
  if (!client) return { error: "Supabase is not configured" };
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return { data };
}

export function isSupabaseConfigured() {
  return getSupabaseConfig().isConfigured;
}
