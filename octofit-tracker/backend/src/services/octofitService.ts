import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string, status = 400) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getRecentFocus(activityType?: string) {
  const type = activityType?.toLowerCase();
  if (!type) return 'endurance';
  if (['run', 'cycle', 'swim', 'walk', 'cardio', 'row'].includes(type)) return 'endurance';
  if (['lift', 'strength', 'press', 'squat'].includes(type)) return 'strength';
  if (['yoga', 'stretch', 'mobility', 'recovery'].includes(type)) return 'mobility';
  return type;
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw badRequest('Activity payload is required');
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;

  if (!userId || !teamId || !type || minutes === undefined || minutes === null) {
    throw badRequest('userId, teamId, type, and minutes are required');
  }

  if (!mongoose.isValidObjectId(String(userId))) {
    throw badRequest('userId must be a valid Mongo ObjectId');
  }

  if (!mongoose.isValidObjectId(String(teamId))) {
    throw badRequest('teamId must be a valid Mongo ObjectId');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw badRequest('User not found', 404);
  }

  const team = await Team.findById(teamId);
  if (!team) {
    throw badRequest('Team not found', 404);
  }

  const activityMinutes = Number(minutes);
  if (!Number.isFinite(activityMinutes) || activityMinutes <= 0) {
    throw badRequest('minutes must be a positive number');
  }

  const normalizedType = String(type).trim();
  if (!normalizedType) {
    throw badRequest('type is required');
  }

  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type: normalizedType,
    minutes: activityMinutes,
    points: activityMinutes,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().sort({ name: 1 }).lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw badRequest('Team payload is required');
  }

  const { name, mascot, members } = input as Record<string, unknown>;
  if (!name || !String(name).trim()) {
    throw badRequest('Team name is required');
  }

  if (!mascot || !String(mascot).trim()) {
    throw badRequest('Team mascot is required');
  }

  const memberList = Array.isArray(members) ? members : [];
  for (const member of memberList) {
    if (!mongoose.isValidObjectId(String(member))) {
      throw badRequest('Each team member must be a valid Mongo ObjectId');
    }
  }

  const team = await Team.create({
    name: String(name).trim(),
    mascot: String(mascot).trim(),
    members: memberList.map((member) => String(member)),
  });

  return team.toObject();
}

export async function getLeaderboard() {
  const leaderboardRows = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
  ]);

  if (!leaderboardRows.length) {
    return [];
  }

  const teamIds = leaderboardRows.map((row) => row._id);
  const teams = await Team.find({ _id: { $in: teamIds } }).lean();
  const teamMap = new Map(teams.map((team) => [team._id.toString(), team.name]));

  return leaderboardRows.map((row, index) => ({
    teamName: teamMap.get(String(row._id)) ?? 'Unknown team',
    totalPoints: row.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const email = normalizeEmail(userEmail ?? '');
  if (!email) {
    throw badRequest('User email is required');
  }

  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw badRequest('User not found', 404);
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const recentFocus = getRecentFocus(recentActivities[0]?.type);
  const goalFocus = String(user.fitnessGoal ?? '').trim().toLowerCase() || recentFocus;
  const workouts = await Workout.find().sort({ title: 1 }).lean();

  const ranked = workouts
    .map((workout) => {
      const focus = String(workout.focus ?? '').toLowerCase();
      let score = 0;
      if (focus === goalFocus) score += 5;
      if (focus === recentFocus) score += 3;
      if (focus === 'endurance' && (recentFocus === 'endurance' || goalFocus === 'endurance')) score += 1;
      if (focus === 'strength' && (recentFocus === 'strength' || goalFocus === 'strength')) score += 1;
      if (focus === 'mobility' && (recentFocus === 'mobility' || goalFocus === 'mobility')) score += 1;
      return { workout, score };
    })
    .sort((left, right) => right.score - left.score || left.workout.title.localeCompare(right.workout.title));

  const best = ranked[0]?.workout;
  if (!best) {
    return [];
  }

  const reason = recentActivities[0]?.type
    ? `Based on your recent ${recentActivities[0].type} activity and goal to improve ${goalFocus}.`
    : `Based on your goal to improve ${goalFocus}.`;

  return [{
    title: best.title,
    focus: best.focus,
    minutes: best.minutes,
    difficulty: best.difficulty,
    reason,
  }];
}

export { User };
