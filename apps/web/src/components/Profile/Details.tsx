import Message from '@components/Profile/Message';
import Follow from '@components/Shared/Follow';
import Markup from '@components/Shared/Markup';
import Slug from '@components/Shared/Slug';
import SuperFollow from '@components/Shared/SuperFollow';
import Unfollow from '@components/Shared/Unfollow';
import ProfileStaffTool from '@components/StaffTools/Panels/Profile';
import { useMessageDb } from '@components/utils/hooks/useMessageDb';
import useStaffMode from '@components/utils/hooks/useStaffMode';
import {
  CogIcon,
  HashtagIcon,
  LocationMarkerIcon,
  UsersIcon
} from '@heroicons/react/outline';
import { BadgeCheckIcon, ExclamationCircleIcon } from '@heroicons/react/solid';
import {
  EXPANDED_AVATAR,
  RARIBLE_URL,
  STATIC_IMAGES_URL
} from '@lenster/data/constants';
import { FollowUnfollowSource } from '@lenster/data/tracking';
import getEnvConfig from '@lenster/data/utils/getEnvConfig';
import type { Profile } from '@lenster/lens';
import formatAddress from '@lenster/lib/formatAddress';
import formatHandle from '@lenster/lib/formatHandle';
import getAvatar from '@lenster/lib/getAvatar';
import getProfileAttribute from '@lenster/lib/getProfileAttribute';
import getScamDetails from '@lenster/lib/getScamDetails';
import isScam from '@lenster/lib/isScam';
import isStaff from '@lenster/lib/isStaff';
import isVerified from '@lenster/lib/isVerified';
import sanitizeDisplayName from '@lenster/lib/sanitizeDisplayName';
import { Button, Image, LightBox, Modal, Tooltip } from '@lenster/ui';
import buildConversationId from '@lib/buildConversationId';
import { buildConversationKey } from '@lib/conversationKey';
import { t, Trans } from '@lingui/macro';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';
import type { Dispatch, FC, ReactNode } from 'react';
import { useState } from 'react';
import { useAppStore } from 'src/store/app';

import Badges from './Badges';
import Followerings from './Followerings';
import InvitedBy from './InvitedBy';
import ProfileMenu from './Menu';
import MutualFollowers from './MutualFollowers';
import MutualFollowersList from './MutualFollowers/List';
import ScamWarning from './ScamWarning';

interface DetailsProps {
  profile: Profile;
  following: boolean;
  setFollowing: Dispatch<boolean>;
}

const Details: FC<DetailsProps> = ({ profile, following, setFollowing }) => {
  const currentProfile = useAppStore((state) => state.currentProfile);
  const [showMutualFollowersModal, setShowMutualFollowersModal] =
    useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const { allowed: staffMode } = useStaffMode();
  const { resolvedTheme } = useTheme();
  const router = useRouter();

  const { persistProfile } = useMessageDb();

  const onMessageClick = () => {
    if (!currentProfile) {
      return;
    }
    const conversationId = buildConversationId(currentProfile.id, profile.id);
    const conversationKey = buildConversationKey(
      profile.ownedBy,
      conversationId
    );
    persistProfile(conversationKey, profile);
    router.push(`/messages/${conversationKey}`);
  };

  const MetaDetails = ({
    children,
    icon,
    dataTestId = ''
  }: {
    children: ReactNode;
    icon: ReactNode;
    dataTestId?: string;
  }) => (
    <div className="flex items-center gap-2" data-testid={dataTestId}>
      {icon}
      <div className="text-md truncate">{children}</div>
    </div>
  );

  const followType = profile?.followModule?.__typename;

  return (
    <div className="mb-4 space-y-5 px-5 sm:px-0">
      <div className="relative -mt-24 h-32 w-32 sm:-mt-32 sm:h-52 sm:w-52">
        <Image
          onClick={() => setExpandedImage(getAvatar(profile, EXPANDED_AVATAR))}
          src={getAvatar(profile)}
          className="h-32 w-32 cursor-pointer rounded-xl bg-gray-200 ring-8 ring-gray-50 dark:bg-gray-700 dark:ring-black sm:h-52 sm:w-52"
          height={128}
          width={128}
          alt={formatHandle(profile?.handle)}
          data-testid="profile-avatar"
        />
        <LightBox
          show={Boolean(expandedImage)}
          url={expandedImage}
          onClose={() => setExpandedImage(null)}
        />
      </div>
      <div className="space-y-1 py-2">
        <div className="flex items-center gap-1.5 text-2xl font-bold">
          <div className="truncate" data-testid="profile-name">
            {sanitizeDisplayName(profile?.name) ??
              formatHandle(profile?.handle)}
          </div>
          {isVerified(profile?.id) && (
            <Tooltip content={t`Verified`}>
              <BadgeCheckIcon
                className="text-brand h-6 w-6"
                data-testid="profile-verified-badge"
              />
            </Tooltip>
          )}
          {isScam(profile?.id) && (
            <Tooltip
              content={
                getScamDetails(profile?.id)?.identifiedOn
                  ? t`Scam indentified on ${getScamDetails(profile?.id)
                      ?.identifiedOn}`
                  : t`Scam`
              }
            >
              <ExclamationCircleIcon
                className="h-6 w-6 text-red-500"
                data-testid="profile-scam-badge"
              />
            </Tooltip>
          )}
        </div>
        <div
          className="flex items-center space-x-3"
          data-testid="profile-handle"
        >
          {profile?.name ? (
            <Slug
              className="text-sm sm:text-base"
              slug={formatHandle(profile?.handle)}
              prefix="@"
            />
          ) : (
            <Slug
              className="text-sm sm:text-base"
              slug={formatAddress(profile?.ownedBy)}
            />
          )}
          {currentProfile &&
            currentProfile?.id !== profile?.id &&
            profile?.isFollowing && (
              <div className="rounded-full bg-gray-200 px-2 py-0.5 text-xs dark:bg-gray-700">
                <Trans>Follows you</Trans>
              </div>
            )}
        </div>
      </div>
      {profile?.bio && (
        <div
          className="markup linkify text-md mr-0 break-words sm:mr-10"
          data-testid="profile-bio"
        >
          <Markup>{profile?.bio}</Markup>
        </div>
      )}
      <div className="space-y-5">
        <ScamWarning profile={profile} />
        <Followerings profile={profile} />
        <div className="flex items-center space-x-2">
          {currentProfile?.id === profile?.id ? (
            <Link href="/settings">
              <Button
                variant="secondary"
                icon={<CogIcon className="h-5 w-5" />}
                outline
              >
                <Trans>Edit Profile</Trans>
              </Button>
            </Link>
          ) : followType !== 'RevertFollowModuleSettings' ? (
            following ? (
              <>
                <Unfollow
                  profile={profile}
                  setFollowing={setFollowing}
                  showText
                />
                {followType === 'FeeFollowModuleSettings' && (
                  <SuperFollow
                    profile={profile}
                    setFollowing={setFollowing}
                    again
                  />
                )}
              </>
            ) : followType === 'FeeFollowModuleSettings' ? (
              <SuperFollow
                profile={profile}
                setFollowing={setFollowing}
                followUnfollowSource={FollowUnfollowSource.PROFILE_PAGE}
                showText
              />
            ) : (
              <Follow
                profile={profile}
                setFollowing={setFollowing}
                followUnfollowSource={FollowUnfollowSource.PROFILE_PAGE}
                showText
              />
            )
          ) : null}
          {currentProfile && <Message onClick={onMessageClick} />}
          <ProfileMenu profile={profile} />
        </div>
        {currentProfile?.id !== profile?.id && (
          <>
            <MutualFollowers
              setShowMutualFollowersModal={setShowMutualFollowersModal}
              profile={profile}
            />
            <Modal
              title={t`Followers you know`}
              icon={<UsersIcon className="text-brand h-5 w-5" />}
              show={showMutualFollowersModal}
              onClose={() => setShowMutualFollowersModal(false)}
            >
              <MutualFollowersList profileId={profile?.id} />
            </Modal>
          </>
        )}
        <div className="divider w-full" />
        <div className="space-y-2">
          <MetaDetails
            icon={<HashtagIcon className="h-4 w-4" />}
            dataTestId="profile-meta-id"
          >
            <Tooltip content={`#${profile?.id}`}>
              <Link
                href={`${RARIBLE_URL}/token/polygon/${
                  getEnvConfig().lensHubProxyAddress
                }:${parseInt(profile?.id)}`}
                target="_blank"
                rel="noreferrer"
              >
                {parseInt(profile?.id)}
              </Link>
            </Tooltip>
          </MetaDetails>
          {getProfileAttribute(profile?.attributes, 'location') && (
            <MetaDetails
              icon={<LocationMarkerIcon className="h-4 w-4" />}
              dataTestId="profile-meta-location"
            >
              {getProfileAttribute(profile?.attributes, 'location')}
            </MetaDetails>
          )}
          {profile?.onChainIdentity?.ens?.name && (
            <MetaDetails
              icon={
                <img
                  src={`${STATIC_IMAGES_URL}/brands/ens.svg`}
                  className="h-4 w-4"
                  height={16}
                  width={16}
                  alt="ENS Logo"
                />
              }
              dataTestId="profile-meta-ens"
            >
              {profile?.onChainIdentity?.ens?.name}
            </MetaDetails>
          )}
          {getProfileAttribute(profile?.attributes, 'website') && (
            <MetaDetails
              icon={
                <img
                  src={`https://www.google.com/s2/favicons?domain=${getProfileAttribute(
                    profile?.attributes,
                    'website'
                  )
                    ?.replace('https://', '')
                    .replace('http://', '')}`}
                  className="h-4 w-4 rounded-full"
                  height={16}
                  width={16}
                  alt="Website"
                />
              }
              dataTestId="profile-meta-website"
            >
              <Link
                href={`https://${getProfileAttribute(
                  profile?.attributes,
                  'website'
                )
                  ?.replace('https://', '')
                  .replace('http://', '')}`}
                target="_blank"
                rel="noreferrer noopener me"
              >
                {getProfileAttribute(profile?.attributes, 'website')
                  ?.replace('https://', '')
                  .replace('http://', '')}
              </Link>
            </MetaDetails>
          )}
          {getProfileAttribute(profile?.attributes, 'twitter') && (
            <MetaDetails
              icon={
                resolvedTheme === 'dark' ? (
                  <img
                    src={`${STATIC_IMAGES_URL}/brands/twitter-light.svg`}
                    className="h-4 w-4"
                    height={16}
                    width={16}
                    alt="Twitter Logo"
                  />
                ) : (
                  <img
                    src={`${STATIC_IMAGES_URL}/brands/twitter-dark.svg`}
                    className="h-4 w-4"
                    height={16}
                    width={16}
                    alt="Twitter Logo"
                  />
                )
              }
              dataTestId="profile-meta-twitter"
            >
              <Link
                href={`https://twitter.com/${getProfileAttribute(
                  profile?.attributes,
                  'twitter'
                )}`}
                target="_blank"
                rel="noreferrer noopener"
              >
                {getProfileAttribute(profile?.attributes, 'twitter')?.replace(
                  'https://twitter.com/',
                  ''
                )}
              </Link>
            </MetaDetails>
          )}
        </div>
      </div>
      {profile.invitedBy ? (
        <>
          <div className="divider w-full" />
          <InvitedBy profile={profile.invitedBy} />
        </>
      ) : null}
      <Badges profile={profile} />
      {isStaff(currentProfile?.id) && staffMode && (
        <ProfileStaffTool profile={profile} />
      )}
    </div>
  );
};

export default Details;
