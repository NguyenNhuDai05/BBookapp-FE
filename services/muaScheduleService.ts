import { api } from './api';

export interface WorkingSchedule {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface MuaTimeOff {
  id: string;
  startAt: string;
  endAt: string;
  reason?: string;
}

export interface MuaScheduleManagement {
  workingSchedules: WorkingSchedule[];
  timeOffs: MuaTimeOff[];
}

export const muaScheduleService = {
  async getMine(): Promise<MuaScheduleManagement> {
    const { data } = await api.get<MuaScheduleManagement>('/Mua/schedule/me');
    return { workingSchedules: data?.workingSchedules || [], timeOffs: data?.timeOffs || [] };
  },
  async replace(schedules: WorkingSchedule[]): Promise<MuaScheduleManagement> {
    const { data } = await api.put<MuaScheduleManagement>('/Mua/schedule', { schedules });
    return data;
  },
};
