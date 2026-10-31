/**
 * Runs only when a test Supabase project is configured.
 * SUPABASE_TEST_URL and SUPABASE_TEST_SECRET_KEY must stay out of EXPO_PUBLIC variables.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_TEST_URL;
const secret = process.env.SUPABASE_TEST_SECRET_KEY;
const publishable = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const enabled = Boolean(url && secret && publishable);

(enabled ? describe : describe.skip)('row level security', () => {
  it('does not let one account read another account’s notifications', async () => {
    const admin = createClient(url!, secret!, { auth: { persistSession: false } });
    const email = `gather-test-${Date.now()}@example.com`;
    const created = await admin.auth.admin.createUser({ email, password: 'password123', email_confirm: true });
    expect(created.error).toBeNull();
    const user = createClient(url!, publishable!, { auth: { persistSession: false } });
    await user.auth.signInWithPassword({ email, password: 'password123' });
    const { data, error } = await user.from('notifications').select('*');
    expect(error).toBeTruthy();
    expect(data ?? []).toEqual([]);
    if (created.data.user) await admin.auth.admin.deleteUser(created.data.user.id);
  });
});
