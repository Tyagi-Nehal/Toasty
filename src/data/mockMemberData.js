export const memberStats = {
  pointsThisMonth: 18,
  topScore: 32,
  rank: 3,
  totalMembers: 42,
}

export const upcomingMeeting = {
  dateLabel: 'Thursday, Feb 12',
  time: '5:15 PM',
  role: 'Table Topics Master',
  assignmentType: 'auto',
  hoursUntilMeeting: 60,
}

export const notifications = [
  {
    id: 1,
    type: 'role_assigned',
    message: "You were auto-assigned the role of Table Topics Master for Thursday's meeting.",
    time: '2 hours ago',
    read: false,
  },
  {
    id: 2,
    type: 'agenda_updated',
    message: "The agenda for this week's meeting was updated by the VPE.",
    time: '5 hours ago',
    read: false,
  },
  {
    id: 3,
    type: 'poll_released',
    message: 'Voting poll is now open — cast your vote before the meeting ends.',
    time: 'Yesterday',
    read: true,
  },
  {
    id: 4,
    type: 'renewal_confirmed',
    message: 'Your membership renewal was confirmed by the Treasurer.',
    time: '3 days ago',
    read: true,
  },
  {
    id: 5,
    type: 'account_approved',
    message: 'Your account was approved by the VPM. Welcome to the club!',
    time: '1 week ago',
    read: true,
  },
]
