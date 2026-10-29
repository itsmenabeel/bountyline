import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ACCOUNT_ROLE_LABEL } from "@/lib/constants/domain";
import { formatDate } from "@/lib/format";
import { AppearanceSetting } from "./appearance-setting";
import { ProfileForm } from "./profile-form";

/**
 * One profile page for every role (design-plan §7.3–7.5): the name form, the account facts
 * the person can't change here, and the appearance setting. Reputation shows for
 * researchers only, since only they earn it.
 */
export async function ProfileView({
  showReputation = false,
}: {
  showReputation?: boolean;
}) {
  const user = await getCurrentUser();

  return (
    <>
      <PageHeader
        title="Profile"
        description="Your name on the platform, your account details, and how the site looks for you."
      />
      <div className="grid max-w-3xl gap-6">
        <Card>
          <CardContent className="flex flex-col gap-6">
            <ProfileForm name={user.name} />
            <dl className="grid gap-x-6 gap-y-3 border-t pt-6 text-sm sm:grid-cols-[auto_1fr]">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="break-all">{user.email}</dd>
              <dt className="text-muted-foreground">Account type</dt>
              <dd>{ACCOUNT_ROLE_LABEL[user.role]}</dd>
              <dt className="text-muted-foreground">Member since</dt>
              <dd>{formatDate(user.createdAt)}</dd>
              {showReputation && (
                <>
                  <dt className="text-muted-foreground">Reputation</dt>
                  <dd className="tabular-nums">
                    {user.reputation.toLocaleString("en-US")}
                  </dd>
                </>
              )}
            </dl>
            <p className="text-sm text-muted-foreground">
              Your email and account type can&apos;t change here. Ask the triage
              team if either needs to.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <AppearanceSetting />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
