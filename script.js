class WorkSchedule {
    constructor() {
        this.currentDate = new Date();
        this.teams = ['1팀', '2팀', '3팀', '4팀'];
        this.selectedTeam = null;
        this.holidays = {
            '1-1': '신정',
            '3-1': '삼일절',
            '5-5': '어린이날',
            '6-6': '현충일',
            '8-15': '광복절',
            '10-3': '개천절',
            '10-9': '한글날',
            '12-25': '크리스마스'
        };
        this.memoData = {};
        this.loadMemoFromLocalStorage();
        this.initializeCalendar();
        this.setupEventListeners();
    }

    initializeCalendar() {
        this.updateMonthDisplay();
        this.renderCalendar();
    }

    setupEventListeners() {
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.initializeCalendar();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.initializeCalendar();
        });

        document.querySelectorAll('.team-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const teamNumber = e.target.getAttribute('data-team');
                this.toggleTeamHighlight(teamNumber);
            });
        });

        // 메모 관련 이벤트 리스너
        const memoModal = document.getElementById('memoModal');
        const memoSaveBtn = document.querySelector('.memo-save');
        const memoCancelBtn = document.querySelector('.memo-cancel');
        const closeMemoBtn = document.querySelector('.close-memo');

        memoSaveBtn.addEventListener('click', () => this.saveMemo());
        memoCancelBtn.addEventListener('click', () => this.closeMemoModal());
        closeMemoBtn.addEventListener('click', () => this.closeMemoModal());

        memoModal.addEventListener('click', (e) => {
            if (e.target === memoModal) {
                this.closeMemoModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && memoModal.classList.contains('show')) {
                this.closeMemoModal();
            }
        });

        window.addEventListener('beforeunload', () => this.saveMemoToLocalStorage());
    }

    toggleTeamHighlight(teamNumber) {
        document.querySelectorAll('.team-button').forEach(btn => {
            btn.classList.remove('active');
        });

        if (this.selectedTeam !== teamNumber) {
            this.selectedTeam = teamNumber;
            document.querySelector(`.team-button[data-team="${teamNumber}"]`).classList.add('active');
        } else {
            this.selectedTeam = null;
        }

        this.renderCalendar();
    }

    updateMonthDisplay() {
        const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
        document.getElementById('currentMonth').textContent = 
            `${this.currentDate.getFullYear()}년 ${monthNames[this.currentDate.getMonth()]}`;
    }

    getTeamSchedule(date) {
        const baseDate = new Date(2024, 0, 1);
        const diffDays = Math.floor((date - baseDate) / (1000 * 60 * 60 * 24));
        const cycleDay = ((diffDays % 4) + 4) % 4;

        const teamPositions = [0, 1, 2, 3];
        
        const dayTeamIndex = teamPositions.findIndex(pos => 
            ((pos + cycleDay) % 4) === 0
        );
        const nightTeamIndex = teamPositions.findIndex(pos => 
            ((pos + cycleDay) % 4) === 1
        );

        return {
            day: this.teams[dayTeamIndex],
            night: this.teams[nightTeamIndex]
        };
    }

    getTeamStatus(date, teamNumber) {
        const baseDate = new Date(2024, 0, 1);
        const diffDays = Math.floor((date - baseDate) / (1000 * 60 * 60 * 24));
        const cycleDay = ((diffDays % 4) + 4) % 4;
        
        const teamStartPosition = teamNumber - 1;
        const currentPosition = (teamStartPosition + cycleDay) % 4;

        switch (currentPosition) {
            case 0: return '주간';
            case 1: return '야간';
            case 2: return '휴무';
            case 3: return '비번';
        }
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        const startingDayIndex = firstDay.getDay(); // 현재 월의 1일이 시작하는 요일 (0:일, 6:토)
        const daysInMonth = lastDay.getDate(); // 현재 월의 총 일수
        
        const calendarDays = document.getElementById('calendarDays');
        calendarDays.innerHTML = '';
        
        // 지난 달의 날짜를 숨기기 위해 빈 셀 추가 (이번 달 1일이 시작하는 요일까지)
        for (let i = 0; i < startingDayIndex; i++) {
            const emptyDayElement = document.createElement('div');
            emptyDayElement.className = 'calendar-day other-month empty-day'; // 'empty-day' 클래스 추가
            calendarDays.appendChild(emptyDayElement);
        }
        
        // 현재 달의 날짜들
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = this.createDayElement(
                day,
                new Date(year, month, day),
                false // 현재 달 날짜
            );
            calendarDays.appendChild(dayElement);
        }
        
        // 다음 달의 날짜를 숨기기 위해 빈 셀 추가 (총 42개 셀을 채우기 위함)
        const totalDaysRendered = startingDayIndex + daysInMonth;
        const remainingCells = 42 - totalDaysRendered; // 6주 * 7일 = 42
        
        for (let i = 0; i < remainingCells; i++) {
            const emptyDayElement = document.createElement('div');
            emptyDayElement.className = 'calendar-day other-month empty-day'; // 'empty-day' 클래스 추가
            calendarDays.appendChild(emptyDayElement);
        }
    }

    createDayElement(dayNumber, date, isOtherMonth) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6 || this.isHoliday(date)) {
            dayElement.classList.add('weekend');
        }
        
        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }
        
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        const dateNumber = document.createElement('div');
        dateNumber.className = 'date-number';
        dateNumber.textContent = dayNumber;
        dayElement.appendChild(dateNumber);
        
        if (this.isHoliday(date)) {
            const holidayName = document.createElement('div');
            holidayName.className = 'holiday-name';
            holidayName.textContent = this.holidays[`${date.getMonth() + 1}-${date.getDate()}`];
            dayElement.appendChild(holidayName);
        }
        
        const shiftInfo = document.createElement('div');
        shiftInfo.className = 'shift-info';

        if (this.selectedTeam) {
            const status = this.getTeamStatus(date, this.selectedTeam);
            const statusDiv = this.createTeamStatus(date, this.selectedTeam, status);
            shiftInfo.appendChild(statusDiv);
        } else {
            const schedule = this.getTeamSchedule(date);
            
            // 주간 근무 표시
            const dayShift = document.createElement('div');
            dayShift.className = 'day-shift';
            dayShift.textContent = `주간 ${schedule.day}`;
            
            // 주간 근무 메모 기능 추가
            const dayTeamNumber = parseInt(schedule.day.charAt(0));
            const dateStr = date.toISOString().split('T')[0];
            const dayMemoKey = `${dateStr}-${dayTeamNumber}-주간`;
            if (this.memoData[dayMemoKey]) {
                dayShift.classList.add('has-memo');
                const dayIndicator = document.createElement('span');
                dayIndicator.className = 'memo-indicator';
                dayShift.appendChild(dayIndicator);

                const dayTooltip = document.createElement('div');
                dayTooltip.className = 'memo-tooltip';
                dayTooltip.textContent = this.memoData[dayMemoKey];
                dayShift.appendChild(dayTooltip);
            }
            dayShift.addEventListener('click', () => {
                this.openMemoModal(dateStr, dayTeamNumber, '주간');
            });
            
            // 야간 근무 표시
            const nightShift = document.createElement('div');
            nightShift.className = 'night-shift';
            nightShift.textContent = `야간 ${schedule.night}`;
            
            // 야간 근무 메모 기능 추가
            const nightTeamNumber = parseInt(schedule.night.charAt(0));
            const nightMemoKey = `${dateStr}-${nightTeamNumber}-야간`;
            if (this.memoData[nightMemoKey]) {
                nightShift.classList.add('has-memo');
                const nightIndicator = document.createElement('span');
                nightIndicator.className = 'memo-indicator';
                nightShift.appendChild(nightIndicator);

                const nightTooltip = document.createElement('div');
                nightTooltip.className = 'memo-tooltip';
                nightTooltip.textContent = this.memoData[nightMemoKey];
                nightShift.appendChild(nightTooltip);
            }
            nightShift.addEventListener('click', () => {
                this.openMemoModal(dateStr, nightTeamNumber, '야간');
            });
            
            shiftInfo.appendChild(dayShift);
            shiftInfo.appendChild(nightShift);
        }
        
        dayElement.appendChild(shiftInfo);
        return dayElement;
    }

    createTeamStatus(date, team, shift) {
        const dateStr = date.toISOString().split('T')[0];
        const memoKey = `${dateStr}-${team}-${shift}`;
        const hasMemo = this.memoData[memoKey];
        
        const statusDiv = document.createElement('div');
        statusDiv.className = `team-status ${shift}${hasMemo ? ' has-memo' : ''}`;
        statusDiv.textContent = shift;
        
        const indicator = document.createElement('span');
        indicator.className = 'memo-indicator';
        statusDiv.appendChild(indicator);
        
        if (hasMemo) {
            const tooltip = document.createElement('div');
            tooltip.className = 'memo-tooltip';
            tooltip.textContent = this.memoData[memoKey];
            statusDiv.appendChild(tooltip);
        }
        
        statusDiv.addEventListener('click', () => {
            this.openMemoModal(dateStr, team, shift);
        });
        
        return statusDiv;
    }

    isHoliday(date) {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return !!this.holidays[`${month}-${day}`];
    }

    // 메모 관련 메서드
    openMemoModal(date, team, shift) {
        this.currentMemoDate = date;
        this.currentMemoTeam = team;
        this.currentMemoShift = shift;
        
        const memoKey = `${date}-${team}-${shift}`;
        document.getElementById('memoText').value = this.memoData[memoKey] || '';
        
        document.getElementById('memoModal').classList.add('show');
    }

    closeMemoModal() {
        document.getElementById('memoModal').classList.remove('show');
        document.getElementById('memoText').value = '';
        this.currentMemoDate = null;
        this.currentMemoTeam = null;
        this.currentMemoShift = null;
    }

    saveMemo() {
        const memoKey = `${this.currentMemoDate}-${this.currentMemoTeam}-${this.currentMemoShift}`;
        const memoContent = document.getElementById('memoText').value.trim();
        
        if (memoContent) {
            this.memoData[memoKey] = memoContent;
        } else {
            delete this.memoData[memoKey];
        }
        
        this.saveMemoToLocalStorage();
        this.renderCalendar();
        this.closeMemoModal();
    }

    saveMemoToLocalStorage() {
        localStorage.setItem('calendarMemos', JSON.stringify(this.memoData));
    }

    loadMemoFromLocalStorage() {
        const savedMemos = localStorage.getItem('calendarMemos');
        if (savedMemos) {
            this.memoData = JSON.parse(savedMemos);
        }
    }
}

// 달력 초기화
new WorkSchedule();