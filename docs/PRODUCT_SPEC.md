# Gather product specification

Gather is a native iOS and Android community app. Tagline: Faith. Questions. Community.

It is a conversation product for Seventh-day Adventists, other Christians, former Adventists, and people exploring Christianity. The feed mixes Bible questions, church life, relationships, prayer, and ordinary conversation. It is not a verse-of-the-day app.

Adults 18 and older. The app does not collect dates of birth. Denominational agreement is not required to participate.

## User stories

- As a visitor, I can read public posts and communities before I create an account.
- As a new member, I choose a username, an optional display name, and communities, then I land in the feed.
- As a member, I ask a question, start a discussion, share a testimony, or request prayer in one of the curated communities.
- As a reader, I vote once, save a post, and open the full discussion.
- As a participant, I reply to a post or to a comment, and the other person sees a notification that I did not create from the client.
- As a member, I report a post or comment, block an author, and manage those blocks later.
- As a moderator, I review reports, remove content, or lock a discussion, and the action is stored.
- As the account owner, I edit my public profile, change appearance, and delete the account so my name leaves existing threads.

## Navigation

Bottom destinations: Home, Explore, Create, Activity, Profile.

Create opens a full-screen composer and hides the tab bar. Search, discussion, community, profile, scripture, settings, and moderation sit on the root stack so the tab bar is not shown there.

## MVP boundaries

Included: public browse, email auth, onboarding, home feed (Popular, New, Following), eight curated communities, join and leave, text posts, nested comments, votes, saves, search, scripture references, reply notifications, public profiles, reports, blocks, basic moderation, account deletion.

Excluded: direct messages, video, livestreams, stories, audio rooms, AI answers, AI moderation, dating, church directories, events, purchases, user-created communities, badges, a full Bible reader, reputation scores, and advertising.

## Acceptance

- Light and dark themes follow the system, with an in-app override.
- Unauthenticated write attempts open sign-in and can resume the action.
- Popular never depends on fabricated vote counts. A new post with no votes still appears.
- Scripture links require a book and a chapter:verse. Ordinary numbers stay plain text.
- Verse text, when shown, is World English Bible only.
- Notifications are created by the database when a comment is inserted. A person is not notified about their own action or about someone they blocked.
- Moderator powers are decided in the database, not by a role field on the client.
- Deleting an account removes the sign-in and the public name. Existing posts and comments stay, attributed to a deleted user.
