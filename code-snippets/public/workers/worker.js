const timers = [];

const alreadyHaveTimerType = (dataType, obj) => {
  return obj.name === dataType;
};

onmessage = (MessageEvent) => {
  const { eventName, data = {} } = MessageEvent.data;
  
  if (eventName === 'setInterval') {
    const dataTypeObjTimersExist = timers.some(alreadyHaveTimerType.bind(null, data.type));

    if (dataTypeObjTimersExist) {
      const prunedTimers = timers.filter(timerObj => {
        if (timerObj.name === data.type) {
          clearInterval(timerObj.timer);
        }
        return timerObj.name !== data.type;
      });
      
      timers = prunedTimers;
    }

    const intervalObj = setInterval(() => {
      postMessage({
        event: eventName,
        data,
      });
    }, data.interval);
    
    const newTimerObj = {
      name: data.type,
      timer: intervalObj,
      appUuid: data.appUuid,
    };
    
    timers.push(newTimerObj);
  }
  if (eventName === 'clearAllTimers') {
    timers.forEach((t) => {
      clearInterval(t.timer);
    });
    
    postMessage({
      event: eventName,
    });
    
    timers = [];
  }
};
