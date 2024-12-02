function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.innerText);
    ev.dataTransfer.setData("originColumn", ev.target.closest('.task-column').id);
}

function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const originColumnId = ev.dataTransfer.getData("originColumn");
    const originColumn = document.getElementById(originColumnId);
    const taskCountElementOrigin = originColumn.querySelector('.task-count');
    const taskCountElementDestination = ev.target.closest('.task-column').querySelector('.task-count');
    const taskCardsOrigin = originColumn.querySelectorAll('.task-card');

    // Remove task from the original column
    const taskCard = Array.from(taskCardsOrigin).find(card => card.innerText === data);
    originColumn.removeChild(taskCard);

    // Add task to the new column
    ev.target.closest('.task-column').appendChild(taskCard);

    // Update task counts
    taskCountElementOrigin.innerText = taskCardsOrigin.length - 1;
    taskCountElementDestination.innerText = parseInt(taskCountElementDestination.innerText) + 1;
}