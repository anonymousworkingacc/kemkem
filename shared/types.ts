// Types shared by the Worker API and the React client. Keep this file free of
// runtime imports so both sides can depend on it.

export type Note = { id: number; body: string; created_at: string }
