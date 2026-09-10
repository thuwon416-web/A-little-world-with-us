begin;

do $$
declare
  target_couple_id uuid;
  first_user_id uuid;
  second_user_id uuid;
begin
  select cl.couple_id, cl.inviter_id, cl.accepted_by
    into target_couple_id, first_user_id, second_user_id
  from public.couple_links cl
  where cl.status = 'accepted'
    and cl.accepted_by is not null
  order by cl.accepted_at nulls last, cl.created_at
  limit 1;

  if target_couple_id is null or first_user_id is null or second_user_id is null then
    raise exception 'No accepted couple link found for 2025 backfill.';
  end if;

  insert into public.messages (couple_id, sender_id, content, message_type, encrypted, created_at)
  select target_couple_id, item.sender_id, item.content, item.message_type, false, item.created_at
  from (values
    (first_user_id, 'Happy New Year, my favorite person. Let us make 2025 gentle and beautiful.', 'text', timestamptz '2025-01-01 09:15:00+06:30'),
    (second_user_id, 'Happy New Year ❤️ I am so happy we get another year together.', 'text', timestamptz '2025-01-01 09:22:00+06:30'),
    (first_user_id, 'The rain sounds so peaceful tonight. Wish you were sitting beside me.', 'text', timestamptz '2025-02-14 21:10:00+06:30'),
    (second_user_id, 'I am beside you in spirit. Sending the biggest hug 🤗', 'text', timestamptz '2025-02-14 21:14:00+06:30'),
    (first_user_id, 'March goal: more walks, fewer rushed goodbyes.', 'text', timestamptz '2025-03-08 08:40:00+06:30'),
    (second_user_id, 'Deal. And breakfast together whenever we can ☀️', 'text', timestamptz '2025-03-08 08:46:00+06:30'),
    (first_user_id, 'I found the little cafe we talked about. Let us go this weekend.', 'text', timestamptz '2025-04-12 16:05:00+06:30'),
    (second_user_id, 'Yes please. I will choose the dessert 🍰', 'sticker', timestamptz '2025-04-12 16:08:00+06:30'),
    (first_user_id, 'Thank you for listening today. I feel calmer after talking with you.', 'text', timestamptz '2025-05-19 22:20:00+06:30'),
    (second_user_id, 'Always. We can take things one small step at a time.', 'text', timestamptz '2025-05-19 22:25:00+06:30'),
    (first_user_id, 'Our little trip is officially booked! I cannot wait.', 'text', timestamptz '2025-06-07 12:30:00+06:30'),
    (second_user_id, 'Best news ever ✈️💛', 'text', timestamptz '2025-06-07 12:33:00+06:30'),
    (first_user_id, 'The sunset today reminded me of our first long conversation.', 'text', timestamptz '2025-07-16 18:45:00+06:30'),
    (second_user_id, 'That memory still makes me smile.', 'text', timestamptz '2025-07-16 18:49:00+06:30'),
    (first_user_id, 'I am proud of us for getting through a difficult week kindly.', 'text', timestamptz '2025-08-23 20:05:00+06:30'),
    (second_user_id, 'Me too. Thank you for choosing patience with me.', 'text', timestamptz '2025-08-23 20:11:00+06:30'),
    (first_user_id, 'September feels like a fresh page. What should we do together?', 'text', timestamptz '2025-09-03 19:30:00+06:30'),
    (second_user_id, 'A quiet picnic and a phone-free evening.', 'text', timestamptz '2025-09-03 19:35:00+06:30'),
    (first_user_id, 'I saved a surprise idea for our anniversary month.', 'text', timestamptz '2025-10-11 14:15:00+06:30'),
    (second_user_id, 'Now I am curious 😄', 'text', timestamptz '2025-10-11 14:17:00+06:30'),
    (first_user_id, 'Cold evenings are better when we share tea.', 'text', timestamptz '2025-11-21 20:00:00+06:30'),
    (second_user_id, 'And when you leave the last piece of snack for me.', 'text', timestamptz '2025-11-21 20:04:00+06:30'),
    (first_user_id, 'Thank you for being my home this year.', 'text', timestamptz '2025-12-24 23:10:00+06:30'),
    (second_user_id, 'Thank you for making ordinary days feel special. I love you ❤️', 'text', timestamptz '2025-12-24 23:14:00+06:30')
  ) as item(sender_id, content, message_type, created_at)
  where not exists (
    select 1 from public.messages existing
    where existing.couple_id = target_couple_id
      and existing.sender_id = item.sender_id
      and existing.content = item.content
      and existing.created_at = item.created_at
  );

  insert into public.memories (couple_id, user_id, title, description, caption, date, category)
  select target_couple_id, item.user_id, item.title, item.description, item.caption, item.date, item.category
  from (values
    (first_user_id, 'A New Year Promise', 'We wrote down a few gentle promises for the year and started slowly.', 'Starting 2025 together.', date '2025-01-01', 'ritual'),
    (second_user_id, 'Rainy Afternoon Cafe', 'A quiet afternoon together with warm drinks, soft rain, and no schedule.', 'Rain, coffee, and us.', date '2025-02-15', 'favorite'),
    (first_user_id, 'March Morning Walks', 'We began taking short morning walks and checking in before the day started.', 'Our small morning ritual.', date '2025-03-08', 'ritual'),
    (second_user_id, 'The Little Garden', 'We visited a small garden and spent the afternoon taking photos of flowers.', 'A peaceful afternoon outside.', date '2025-04-13', 'travel'),
    (first_user_id, 'A Difficult Week, Kindly Held', 'A journal note about choosing patience and listening when the week felt heavy.', 'We made space for each other.', date '2025-05-20', 'journal'),
    (second_user_id, 'Our First 2025 Trip', 'The first planned trip of the year, filled with snacks, music, and small surprises.', 'Trip memories we want to keep.', date '2025-06-08', 'travel'),
    (first_user_id, 'Sunset Conversation', 'We sat together at sunset and talked about where we want the next year to go.', 'The sky looked like a promise.', date '2025-07-16', 'favorite'),
    (second_user_id, 'Choosing Patience', 'A journal entry about repairing a difficult moment without keeping score.', 'We chose kindness again.', date '2025-08-23', 'journal'),
    (first_user_id, 'Phone-Free Picnic', 'A simple picnic where we left our phones away and focused on the evening.', 'Just us for a while.', date '2025-09-04', 'ritual'),
    (second_user_id, 'The Surprise Idea', 'A saved note about an anniversary surprise and the excitement of planning it.', 'A secret worth keeping.', date '2025-10-11', 'favorite'),
    (first_user_id, 'Tea on Cold Evenings', 'A small seasonal ritual of sharing tea and snacks after a long day.', 'Tea tastes better together.', date '2025-11-21', 'ritual'),
    (second_user_id, 'Thank You for Being Home', 'A year-end reflection about how ordinary days became meaningful together.', 'Our 2025 closing note.', date '2025-12-24', 'journal')
  ) as item(user_id, title, description, caption, date, category)
  where not exists (
    select 1 from public.memories existing
    where existing.couple_id = target_couple_id
      and existing.title = item.title
      and existing.date = item.date
  );
end $$;

commit;
