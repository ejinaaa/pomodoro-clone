import { fetchSettings } from './axios/fetch';
import { updateSettings } from './axios/update';
import timerState from './timeState';

// Variables
const $addTaskBtn = document.querySelector('.add-task-btn');
const $addTaskContainer = document.querySelector('.add-task-container');
const $inputTask = document.querySelector('.add-task-container .input-task');
const $tasks = document.querySelector('.tasks');
const $inputEstNum = document.querySelector('.input-est-num');
const $removeCompletedTasksBtn = document.querySelector(
  '.remove-completed-tasks-btn'
);
const $currentProgress = document.querySelector('.current-progress');
const $addTaskBtnContainer = document.querySelector(
  '.add-task-container .btn-container'
);
const $increaseEstBtn = document.querySelector(
  '.set-est-container .increase-btn'
);
const $decreaseEstBtn = document.querySelector(
  '.set-est-container .decrease-btn'
);
const $currentEst = document.querySelector('.current-progress .est .num');
const $currentAct = document.querySelector('.current-progress .act .num');
const $currentFinishTime = document.querySelector(
  '.current-progress .finish-time .num'
);
const $activeTaskSubject = document.querySelector('.active-task');
const $saveBtn = document.querySelector('.save-btn');
const $msgContainer = document.querySelector('.msg-container');
const $time = document.querySelector('.main__time-set');

let pomodoroTime = 0;
let shortBreakTime = 0;
let longBreakTime = 0;
let longBreakInterval = 0;

export default function task() {
  // Functions
  const render = (() => {
    const getTemplate = task => {
      return `<li id="${task.id}" class="task ${
        task.active ? 'active' : ''
      }" draggable="true">
      <input type="checkbox" id="ck-${task.id}" class="checkbox" ${
        task.completed ? 'checked' : ''
      }/>
      <label for="ck-${
        task.id
      }"><i class="fas fa-check-circle check-icon"></i></label>
      <span class="task-subject">${task.content}</span>
      <span class="est-counter">
        <span class="est-done">${task.leftEst}</span>
        /${task.allEst}
      </span>
      <button class="remove-task-btn">
        <i class="fas fa-minus-circle remove-icon"></i>
      </button>
    </li>`;
    };

    return tasks => {
      $tasks.innerHTML = [...tasks].map(task => getTemplate(task)).join('');

      if (tasks.length) $currentProgress.classList.add('active');
      else if (!tasks.length) $currentProgress.classList.remove('active');

      if (tasks.every(({ active }) => active === false))
        $msgContainer.classList.remove('active');

      updateCurrentProgress();
    };
  })();

  const getTasks = () => {
    fetchSettings().then(res => {
      pomodoroTime = res.pomo_time;
      shortBreakTime = res.short_break;
      longBreakTime = res.long_break;
      longBreakInterval = res.long_interval;

      updateAct();
      render(res.tasks);
    });
  };

  const updateCurrentProgress = () => {
    fetchData().then(res => {
      const currentEst = res.tasks.reduce(
        (acc, { completed, allEst }) => (completed ? acc : acc + allEst),
        0
      );

      $currentEst.textContent = currentEst;

      const currentTime = new Date();
      const pomoMinutes =
        pomodoroTime * currentEst +
        shortBreakTime * (currentEst - 1) +
        (currentEst > longBreakInterval
          ? longBreakTime * Math.floor(currentEst / longBreakInterval)
          : 0);
      const totalMinutes =
        currentTime.getHours() * 60 + (currentTime.getMinutes() + pomoMinutes);
      const totalTime = `${Math.floor(totalMinutes / 60)} : ${
        ('' + (totalMinutes % 60)).length === 1
          ? '0' + (totalMinutes % 60)
          : totalMinutes % 60
      }`;

      $currentFinishTime.textContent = totalTime;
    });
  };

  const addTask = (inputTaskValue, inputEstNum) => {
    fetchData().then(res => {
      const generateId = Math.max(...res.tasks.map(task => task.id), 0) + 1;
      const tasks = [
        ...res.tasks,
        {
          id: generateId,
          content: inputTaskValue,
          allEst: inputEstNum,
          leftEst: 0,
          completed: false,
          active: false
        }
      ];

      updateSettings({ tasks }).then(() => getTasks());
    });
  };

  const removeTask = targetId => {
    fetchSettings().then(res => {
      const tasks = res.tasks.filter(({ id }) => +targetId !== id);

      updateSettings({ tasks }).then(() => getTasks());
    });
  };

  const toggleTask = targetId => {
    fetchData().then(res => {
      const tasks = res.tasks.map(task =>
        +targetId === task.id ? { ...task, completed: !task.completed } : task
      );

      updateSettings({ tasks }).then(() => getTasks());
    });
  };

  const removeCompletedTasks = () => {
    fetchSettings().then(res => {
      const tasks = [...res.tasks.filter(({ completed }) => !completed)];

      updateSettings({ tasks }).then(() => getTasks());
    });
  };

  const activateTask = targetId => {
    fetchData().then(res => {
      const tasks = res.tasks.map(task => ({
        ...task,
        active: +targetId === task.id
      }));

      updateSettings({ tasks }).then(() => getTasks());
    });
  };

  const updateLeftEst = () => {
    fetchData().then(res => {
      const tasks = res.tasks.map(task =>
        task.active ? { ...task, leftEst: ++task.leftEst } : task
      );

      updateSettings({ tasks }).then(() => getTasks());
    });
  };

  const updateAct = () => {
    fetchData().then(res => {
      const actNum = res.tasks.reduce((acc, { leftEst }) => acc + +leftEst, 0);

      $currentAct.textContent = actNum;
    });
  };

  // Events
  document.addEventListener('DOMContentLoaded', getTasks);

  $addTaskBtn.addEventListener('click', () => {
    $addTaskBtn.classList.remove('active');
    $addTaskContainer.classList.add('active');
    $inputTask.focus();
  });

  $addTaskContainer.addEventListener('keyup', e => {
    if (e.key !== 'Enter' || !$inputTask.value) return;

    if (e.target.matches('.input-task')) $inputEstNum.focus();
    if (e.target.matches('.input-est-num')) $saveBtn.focus();
  });

  $inputTask.addEventListener('keyup', e => {
    if (!e.target.value) $saveBtn.classList.remove('active');
    else $saveBtn.classList.add('active');
  });

  $increaseEstBtn.addEventListener('click', () => {
    ++$inputEstNum.value;
  });

  $decreaseEstBtn.addEventListener('click', () => {
    if ($inputEstNum.value < 2) return;
    --$inputEstNum.value;
  });

  $addTaskBtnContainer.addEventListener('click', e => {
    if (e.target.matches('.cancel-btn')) {
      $addTaskBtn.classList.add('active');
      $addTaskContainer.classList.remove('active');
    } else if (e.target.matches('.save-btn') && $inputTask.value) {
      addTask($inputTask.value, +$inputEstNum.value);
      $saveBtn.classList.remove('active');
      $inputTask.focus();
    }

    $inputTask.value = '';
    $inputEstNum.value = 1;
  });

  $tasks.addEventListener('click', e => {
    const targetTask = e.target.closest('.task');

    if (e.target.matches('.remove-icon')) {
      removeTask(targetTask.id);
    } else if (
      e.target.matches('.check-icon') ||
      e.target.matches('.checkbox')
    ) {
      toggleTask(targetTask.id);
    } else {
      activateTask(targetTask.id);
      $msgContainer.classList.add('active');
      $activeTaskSubject.textContent = targetTask.children[2].textContent;
    }
  });

  $removeCompletedTasksBtn.addEventListener('click', () => {
    removeCompletedTasks();
  });

  $time.addEventListener('timeEnd', () => {
    if (timerState.state !== 'pomodoro') return;

    updateAct();
    updateLeftEst();
  });
}
