import { requireAdmin } from "../../../lib/roleGuard.js";
import { prisma } from "../../../lib/prisma.js";
import { changeUserRoleAction, deleteUserAction } from "./actions.js";

const ROLES = ["CUSTOMER", "EMPLOYEE", "ADMIN"];

export default async function AdminAccountsPage() {
  const admin = await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });

  return (
    <div className="mx-auto w-full max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">Accounts</h1>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Verified</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Delete</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = user.id === admin.id;
              const orderCount = user._count.orders;

              return (
                <tr key={user.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-3 text-zinc-900">{user.name}</td>
                  <td className="px-4 py-3 text-zinc-600">{user.email}</td>
                  <td className="px-4 py-3 text-zinc-600">{user.isVerified ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">
                    {isSelf ? (
                      <span className="text-zinc-400">{user.role} (you)</span>
                    ) : (
                      <form action={changeUserRoleAction} className="flex items-center gap-2">
                        <input type="hidden" name="userId" value={user.id} />
                        <select
                          name="role"
                          defaultValue={user.role}
                          className="rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                        >
                          {ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          Save
                        </button>
                      </form>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isSelf ? (
                      <span className="text-xs text-zinc-400">—</span>
                    ) : orderCount > 0 ? (
                      <span className="text-xs text-zinc-400">
                        Has {orderCount} order{orderCount === 1 ? "" : "s"} — can&apos;t delete
                      </span>
                    ) : (
                      <form action={deleteUserAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <button
                          type="submit"
                          className="rounded-lg border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
