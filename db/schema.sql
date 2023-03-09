-- Convention: associative tables are prefixed with `assoc_*`.

CREATE TYPE user_role AS ENUM ('USER', 'MODERATOR', 'ADMIN');
CREATE TYPE notification_event AS ENUM ('ARGUMENT', 'TICKET', 'DEBATE', 'SUGGESTION');
create type argument_type as enum ('PRO', 'CON');
create type board_list_type as enum ('PENDING', 'IN REVIEW', 'CANCELED', 'ACCEPTED');

CREATE TABLE "user" (
	id serial primary key,
	username varchar(80) unique not null,
	password varchar(65) not null,
	email varchar(255) unique not null,
	created_at timestamp default now(),
  role user_role
);

CREATE TABLE notification (
  id serial primary key,
  title varchar(40) not null,
  content varchar(100) not null,
  recipient_id int not null,
  event notification_event not null,

  constraint fk_user_recipient_id foreign key(recipient_id) references "user"(id)
);

CREATE TABLE suggestion (
  id serial primary key,
  title varchar(40) not null,
  content text not null,
  suggested_by int not null,

  constraint fk_user_suggested_by foreign key(suggested_by) references "user"(id)
);

CREATE TABLE ticket (
  id serial primary key,
  created_by int not null,
  assigned_to int,
  board_list board_list_type null,

  constraint fk_user_created_by foreign key(created_by) references "user"(id) on delete cascade
  -- constraint fk_user_assigned_to foreign key(assigned_to) references "user"(id) on delete no action
);

CREATE TABLE debate (
  id serial primary key,
  ticket_id int not null,
  title varchar(80) not null,
  created_at timestamp default now(),
  modified_at timestamp default now()

  -- constraint fk_ticket_id foreign key(ticket_id) references ticket(id) on delete no action
);

create table user_debate_subscription (
  user_id int not null,
  debate_id int not null,
  subscribed_at timestamp default now(),

  constraint fk_debate_id foreign key(debate_id) references debate(id),
  constraint fk_user_id foreign key(user_id) references "user"(id)
);

create table ticket_tag(
  id serial primary key,
  name varchar(30) not null
);

create table assoc_ticket_tag (
  ticket_id int not null,
  tag_id int not null,

  constraint fk_ticket_id foreign key(ticket_id) references ticket(id),
  constraint fk_tag_id foreign key(tag_id) references ticket_tag(id)
);

create table debate_tag (
  id serial primary key,
  name varchar(30) not null
);

create table assoc_debate_tag (
  debate_id int not null,
  tag_id int not null,

  constraint fk_debate_id foreign key(debate_id) references debate(id) on delete cascade,
  -- constraint fk_tag_id foreign key(tag_id) references debate_tag(id) on delete no action
  primary key (debate_id, tag_id)
);

create table argument (
  id serial primary key,
  debate_id int not null,
  ticket_id int not null,
  title varchar(80) not null,
  content text not null,
  counterargument_to int,
  created_by int not null,
  created_at timestamp default now(),
  type argument_type,
  is_draft boolean default false,

  constraint fk_debate_id foreign key(debate_id) references debate(id) on delete cascade,
  -- constraint fk_ticket_id foreign key(ticket_id) references ticket(id),
  constraint fk_created_by foreign key(created_by) references "user"(id)
);

create table ticket_comment (
  id serial primary key, 
  ticket_id int not null,
  content text not null,
  commenter_id int not null,
  created_at timestamp default now(),
  modified_at timestamp default now(),

  constraint fk_ticket_id foreign key(ticket_id) references ticket(id),
  constraint fk_commenter_id foreign key(commenter_id) references "user"(id)
);