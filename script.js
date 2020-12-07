var app = angular.module("myApp", []);
app.controller("myCtrl", function ($scope) {
  $scope.sim_end = false;
  $scope.start = {
    mean_i: 1,
    mean_s: 0.5,
    num_delays_req: 1000,
    e_type: 1,
    e_time: 480,
    sim_type: 1,
  };

  $scope.manually = {
    arrival_services: [],
    number_of_as: 1,
    e_type: 2,
    num_delays_req: 6,
    sim_type: 2,
  };

  let universityExample1 = {
    e_time: 32,
    e_type: "2",
    num_delays_req: 6,
    number_of_as: 9,
    s_type: 2,
    sim_type: 2,
    arrival_services: [
      { arrival: 0.4, service: 2.0 },
      { arrival: 1.2, service: 0.7 },
      { arrival: 0.5, service: 0.2 },
      { arrival: 1.7, service: 1.1 },
      { arrival: 0.2, service: 3.7 },
      { arrival: 1.6, service: 0.6 },
      { arrival: 0.2, service: 0 },
      { arrival: 1.4, service: 0 },
      { arrival: 1.9, service: 0 },
    ],
  };

  $scope.sim_type = 0;
  $scope.chooseSimType = (type) => {
    $scope.sim_type = type;
  };

  $scope.initAs = (number) => {
    for (let i = 0; i < number; i++)
      $scope.manually.arrival_services.push({
        arrival: 0.0,
        service: 0.0,
      });
  };

  $scope.restart = () => {
    let obj = localStorage.getItem("objlast");
    if (obj) {
      obj = JSON.parse(obj);
      $scope.sim_type = obj.sim_type;
      if (sim_type == 1) {
        $scope.start = obj;
      } else {
        $scope.manually = obj;
      }
      $scope.startSim(obj);
    }
  };

  $scope.universityExStart = () => {
    let obj = universityExample1;
    console.log("obj", obj);
    localStorage.setItem("objlast", JSON.stringify(obj));

    if (obj) {
      $scope.sim_type = obj.sim_type;
      if (sim_type == 1) {
        $scope.start = obj;
      } else {
        $scope.manually = obj;
      }
      $scope.startSim(obj);
    }
  };

  $scope.startSim = (obj) => {
    localStorage.setItem("objlast", JSON.stringify(obj));

    $scope.loading = true;
    sim_end = false;
    obj.s_type = $scope.sim_type;

    console.log("obj", obj);
    setTimeout(function () {
      sasi().startSim(obj, (result) => {
        $scope.sim_end = true;

        result.table = result.table.map((ele) => ({
          ...ele,
          area_queue: toDecimal(ele.area_queue, 2),
          area_server: toDecimal(ele.area_server, 2),
          sim_time: toDecimal(ele.sim_time, 2),
          time_last_event: toDecimal(ele.time_last_event, 2),
          total_of_delays: toDecimal(ele.total_of_delays, 2),
          area_server_status: toDecimal(ele.area_server_status, 2),
          time_arrival: ele.time_arrival.map((ee) => toDecimal(ee, 2)),
          event_list: ele.event_list.map((ee) => toDecimal(ee, 2)),
          system_event_type: ele.system_event_type === 1 ? "Arrive" : "Depart",
        }));
        console.log(
          "*************** Table Result - FULL ***************",
          result.table
        );

        $scope.sim_result = {
          ...result,
          table: result.table.slice(0, 30),
        };
        $scope.loading = false;
        $scope.$digest();
      });
    }, 1000);
  };

  let obj = localStorage.getItem("objlast");
  if (obj) $scope.historyExists = true;
  else $scope.historyExists = false;
});
