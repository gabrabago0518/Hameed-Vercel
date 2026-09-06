"use client";

// A plain Server Component form has no way to show a confirm dialog before
// submitting, so this one small piece is a client component — everything
// else on /admin/accounts stays a Server Component. deleteUserAction itself
// never calls redirect() on its success path, so calling it from here is
// safe (same pattern as PhoneField.jsx/AddressField.jsx elsewhere).
export default function DeleteAccountForm({ action, userId, userName }) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(`Are you sure you want to delete ${userName}'s account? This can't be undone.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        className="rounded-lg border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
      >
        Delete
      </button>
    </form>
  );
}
