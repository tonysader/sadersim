import { lcgrand } from "./generator";

let tableItem;
const tableItem_null = {
  system_clients: [],
  system_event_type: null,
  server_status: null,
  num_in_queue: null,
  time_arrival: [],
  time_last_event: null,
  sim_time: null,
  event_list: [null, null, null],
  num_delay: null,
  total_of_delays: null,
  area_queue: null,
  area_server: null,
};
let table = [];

let rep = {};

const Q_LIMIT = 100; /* Limit on queue length. */
const BUSY = 1; /* Mnemonics for server's being busy */
const IDLE = 0; /* and idle. */

let errors = [],
  exit = false;

let next_event_type,
  num_custs_delayed,
  num_delays_required,
  num_events,
  num_in_q,
  server_status,
  area_num_in_q,
  area_server_status,
  mean_interarrival,
  mean_service,
  sim_time,
  time_arrival = [],
  time_next = [],
  time_last_event,
  time_next_event = [],
  total_of_delays,
  end_time;

const expon = (mean) => {
  return -mean * log(lcgrand(1));
};
const initSim = () => {
  server_status = IDLE;
  num_in_q = 0;
  time_last_event = 0;

  sim_time = 0.0;

  num_custs_delayed = 0;
  total_of_delays = 0.0;
  area_num_in_q = 0.0;
  area_server_status = 0.0;

  time_next_event = [null, sim_time + expon(mean_interarrival), 1.0e30];
};

const timing = () => {
  let min_time = 99999999;
  next_event_type = 0;

  for (let i = 1; i <= num_events; i++) {
    if (time_next_event[i] < min_time) {
      min_time = time_next_event[i];
      next_event_type = i;
    }
  }

  if (next_event_type === 0) {
    errors.push(`Event list is empty at time ${sim_time}`);
    exit = true;
  }
  sim_time = min_time;

  tableItem.sim_time = sim_time;
  tableItem.system_event_type = next_event_type;
};

const update_time_avg_stats = () => {
  let time_since_last_event = sim_time - time_last_event;
  time_last_event = sim_time;

  area_num_in_q += num_in_q * time_since_last_event;
  area_server_status += server_status * time_since_last_event;

  tableItem.time_last_event = time_last_event;
  tableItem.area_queue = area_num_in_q;
  tableItem.area_server = area_server_status;
};

const arrive = () => {
  time_next_event[1] = sim_time + expon(mean_interarrival);
  if (server_status == BUSY) {
    num_in_q++;
    if (num_in_q > Q_LIMIT) {
      errors.push(`Overflow in the queue, sim_time:${sim_time}`);
      exit = true;
    }
    time_arrival[num_in_q] = sim_time;

    tableItem.num_in_queue = num_in_q;
    tableItem.time_arrival = time_arrival;
  } else {
    /* Server is idle, so arriving customer has a delay of zero.  (The
           following two statements are for program clarity and do not affect
           the results of the simulation.) */

    delay = 0.0;
    total_of_delays += delay;
    /* Increment the number of customers delayed, and make server busy. */
    num_custs_delayed++;
    server_status = BUSY;

    time_next_event[2] = sim_time + expon(mean_service);

    tableItem.total_of_delays = total_of_delays;
    tableItem.num_delay = num_custs_delayed;
    tableItem.server_status = server_status;
    tableItem.event_list[2] = time_next_event[2];
  }

  tableItem.event_list[1] = time_next_event[1];
};

const depart = () => {
  if (num_in_q === 0) {
    server_status = IDLE;
    event_list[2] = 1.0e30;

    tableItem.server_status = server_status;
    tableItem.event_list[2] = event_list[2];
  } else {
    num_in_q--;
    delay = sim_time - time_arrival[1];
    total_of_delays += delay;

    num_custs_delayed++;
    time_next_event[2] = sim_time + expon(mean_service);

    for (let i = 1; i <= num_in_q; i++) time_arrival[i] = time_arrival[i + 1];

    tableItem.num_in_queue = num_in_q;
    tableItem.total_of_delays = total_of_delays;
    tableItem.num_delay = num_custs_delayed;
    tableItem.time_arrival = time_arrival;
  }
};

const report = () => {
  rep.average_delay_in_q = total_of_delays / num_custs_delayed;
  rep.average_num_in_q = area_num_in_q / sim_time;
  rep.average_server_util = area_server_status / sim_time;
  rep.time_end = sim_time;
};

export let startSim = ({ mean_i, mean_s, num_delays_req }, finish) => {
  mean_interarrival = mean_i;
  mean_service = mean_s;
  num_delays_required = num_delays_req;

  num_events = 2;
  initSim();

  while (num_custs_delayed < num_delays_required) {
    tableItem = tableItem_null;
    timing();
    update_time_avg_stats();

    switch (next_event_type) {
      case 1:
        arrive();
        break;
      case 2:
        depart();
        break;
    }

    table.push(tableItem);
  }

  report();

  finish({
    rep,
    errors,
    table,
  });
};
