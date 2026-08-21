export function getDeclinePenalty(hoursUntilMeeting) {
  if (hoursUntilMeeting >= 48) {
    return { points: 0, label: 'No points will be deducted.' }
  }
  if (hoursUntilMeeting >= 24) {
    return { points: -2, label: 'You will lose 2 points.' }
  }
  return { points: -4, label: 'You will lose 4 points.' }
}
