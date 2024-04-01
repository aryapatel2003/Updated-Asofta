import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { RouteUrlConstants } from "src/app/appConfig";
import { MachineErrorTypeOperationView } from "src/app/_classes/MachineErrorTypeOperationView";
import { MachineErrorTypeView } from "src/app/_classes/MachineErrorTypeView";
import { SocketResponseView } from "src/app/_classes/SocketResponseView";
import { WebSocketService } from "src/app/_services/webSocketService";
import { FormBuilder } from "@angular/forms";
import { SensorDataView } from "src/app/_classes/SensorDataView";
import { MachineView } from "src/app/_classes/MachineView";
import { MachineCapacityView } from "src/app/_classes/MachineCapacityView";
import { MachineSensorView } from "src/app/_classes/MachineSensorView";

@Component({
  selector: "app-technician-mode",
  templateUrl: "./technician-mode.component.html",
  styleUrls: ["./technician-mode.component.css"],
})
export class TechnicianModeComponent implements OnInit, OnDestroy {
  public outOfServiceMessage;
  public socketMessage;
  public socketConnectionStatus;
  public currentErrors: Array<MachineErrorTypeView> =
    new Array<MachineErrorTypeView>();
  public sensorDataModels: Array<SensorDataView> = new Array<SensorDataView>();
  public machineView: MachineView;
  public machineCapacityView: MachineCapacityView;
  public machineSensorView: MachineSensorView;

  public showMachineIsReady = true;
  public showOutOfService = false;

  updateCapacityPopup = false;
  updateSensorPopup = false;
  passwordIncorrectPopup = false;
  binFullError;
  checkoutForm = this.formBuilder.group({
    password: "",
    value: "",
  });

  constructor(
    private router: Router,
    private webSocketService: WebSocketService,
    private formBuilder: FormBuilder
  ) {
    this.machineCapacityView = new MachineCapacityView();
    this.machineSensorView = new MachineSensorView(); // <-- Error occurs here
    this.machineView = new MachineView();
    this.socketMessage = this.webSocketService.getSocketMessage.subscribe(
      (response: SocketResponseView) => {
        console.log("Socket Response In Maintenance Mode Component");
        console.log(response);
        if (response.socketCommand == 1) {
          this.machineIsReady();
          if (response.maintenanceModeResponseView != null) {
            this.currentErrors =
              response.maintenanceModeResponseView.currentErrors;
            this.machineView = response.maintenanceModeResponseView.machineView;
            this.machineCapacityView =
              response.maintenanceModeResponseView.machineCapacityView ||
              new MachineCapacityView();
            this.machineSensorView =
              response.maintenanceModeResponseView.machineSensorView ||
              new MachineSensorView();
            console.log(this.machineView);
          }
        } else if (response.socketCommand == 3) {
          this.outOfServiceMessage = response.socketMessage;
          this.machineInternetLost();
        } else if (response.socketCommand == 4) {
          this.outOfServiceMessage = response.socketMessage;
          this.machinePLCConnectionLost();
        } else if (response.socketCommand == 7) {
          console.log("hii from maintenance mode command 7");
          this.logout();
        } else if (response.socketCommand == 6) {
          this.binFullError = response.socketMessage;
          this.passwordIncorrectPopup = true;
        } else if (response.socketCommand == 8) {
          this.sensorDataModels =
            response.maintenanceModeResponseView.sensorDataModels;
        }
        // else if(response.socketCommand == 9){
        //   window.location.reload();
        // }
      }
    );
    this.socketConnectionStatus =
      this.webSocketService.getConnectionStatus.subscribe((status) => {
        console.log("websocket status in Maintenance Mode Component :", status);
      });
  }
  ngOnDestroy(): void {
    this.socketConnectionStatus.unsubscribe();
    this.socketMessage.unsubscribe();
    console.log("Maintenance Mode Component Component ngOnDestroy Call");
  }

  ngOnInit(): void {
    //   const machineCapacityData = {
    //     plasticCapacity: "1000",
    //     glassCapacity: "1000",
    //     aluCapacity: "100",
    //     printCapacity: "500",
    //     maxTransaction: "300",
    //     maxAutoCleaning: "400"
    // };

    // this.machineCapacityView = new MachineCapacityView(machineCapacityData);

    let loginMessageObject = {
      clientCommand: 2,
      maintenanceSocketRequestView: {
        login: true,
      },
    };
    this.webSocketService.getWebSocket.message(loginMessageObject);
  }

  updateCapacity() {
    this.updateCapacityPopup = true;
  }

  updateSensor() {
    this.updateSensorPopup = true;
  }

  closePopupFun() {
    this.passwordIncorrectPopup = false;
    this.updateCapacityPopup = false;
    this.updateSensorPopup = false;
  }

  machineIsReady() {
    this.showMachineIsReady = true;
    this.showOutOfService = false;
    this.outOfServiceMessage = "";
  }

  machineInternetLost() {
    this.showMachineIsReady = false;
    this.showOutOfService = true;
  }

  machinePLCConnectionLost() {
    this.showMachineIsReady = false;
    this.showOutOfService = true;
  }

  back() {
    let backButtonObject = {
      clientCommand: 7,
    };
    this.webSocketService.getWebSocket.message(backButtonObject);
  }

  shutdown() {
    let backButtonObject = {
      clientCommand: 8,
    };
    this.webSocketService.getWebSocket.message(backButtonObject);
  }

  restart() {
    let backButtonObject = {
      clientCommand: 9,
    };
    this.webSocketService.getWebSocket.message(backButtonObject);
  }

  logout() {
    // let loginMessageObject = {
    //   clientCommand : 2,
    //   maintenanceSocketRequestView : {
    //     login : false
    //   }
    // }
    // this.webSocketService.getWebSocket.message(loginMessageObject);
    this.router.navigateByUrl("/" + RouteUrlConstants.home);
  }

  doResolve(machineErrorTypeView: MachineErrorTypeView) {
    let maintenanceOperationMessage = {
      clientCommand: 2,
      maintenanceSocketRequestView: {
        login: true,
        resolve: true,
        resolveErrorId: machineErrorTypeView.id,
      },
    };
    this.webSocketService.getWebSocket.message(maintenanceOperationMessage);
  }

  doSubmit() {
    var number = this.checkoutForm.value;
    let maintenanceOperationMessage = {
      clientCommand: 10,
      maintenanceSocketRequestView: {
        machineCapacityView: this.machineCapacityView,
      },
      password: number.password,
    };
    this.webSocketService.getWebSocket.message(maintenanceOperationMessage);
    this.updateCapacityPopup = false;
    this.checkoutForm.get("password")?.setValue(null);

    let loginMessageObject = {
      clientCommand: 2,
      maintenanceSocketRequestView: {
        login: true,
      },
    };
    this.webSocketService.getWebSocket.message(loginMessageObject);
  }

  doSubmitSensor() {
    var number = this.checkoutForm.value;
    let maintenanceOperationMessage = {
      clientCommand: 11,
      maintenanceSocketRequestView: {
        machineSensorView: this.machineSensorView,
      },
      password: number.password,
    };
    this.webSocketService.getWebSocket.message(maintenanceOperationMessage);
    this.updateSensorPopup = false;
    this.checkoutForm.get("password")?.setValue(null);

    let loginMessageObject = {
      clientCommand: 2,
      maintenanceSocketRequestView: {
        login: true,
      },
    };
    this.webSocketService.getWebSocket.message(loginMessageObject);
  }

  backButton() {
    this.router.navigateByUrl("/" + RouteUrlConstants.maintenance_mode);
  }

  // isAluminiumn: boolean = false;
  // isGlass: boolean = false;
  // isPat: boolean = false;

  glassButtonChanged(checked: boolean): void {
    this.machineCapacityView.isGlassOff = checked;
    let maintenanceOperationMessage = {
      clientCommand: 12,
      maintenanceSocketRequestView: {
        machineCapacityView: this.machineCapacityView,
      },
    };
    this.webSocketService.getWebSocket.message(maintenanceOperationMessage);
  }

  plasticButtonChanged(checked: boolean): void {
    this.machineCapacityView.isPlasticOff = checked;
    let maintenanceOperationMessage = {
      clientCommand: 12,
      maintenanceSocketRequestView: {
        machineCapacityView: this.machineCapacityView,
      },
    };
    this.webSocketService.getWebSocket.message(maintenanceOperationMessage);
  }

  aluButtonChanged(checked: boolean): void {
    this.machineCapacityView.isAluOff = checked;
    let maintenanceOperationMessage = {
      clientCommand: 12,
      maintenanceSocketRequestView: {
        machineCapacityView: this.machineCapacityView,
      },
    };
    this.webSocketService.getWebSocket.message(maintenanceOperationMessage);
  }

  /* Start Virtual Keybord popup */
  keyboardClosed: boolean = true;
  textInput: string = "";
  activeInput: string = "";
  keyboardRows: string[][] = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["0"],
  ];

  appendToInput(key: string) {
    if (this.activeInput && this.activeInput.startsWith("capacity")) {
      const inputField = this.activeInput.substring("capacity".length); // Extract field name from activeInput
      this.machineCapacityView[inputField] =
        (this.machineCapacityView[inputField] || "") + key;
    } else if (this.activeInput && this.activeInput.startsWith("sensor")) {
      const inputField = this.activeInput.substring("sensor".length); // Extract field name from activeInput
      this.machineSensorView[inputField] =
        (this.machineSensorView[inputField] || "") + key;
    }
  }

  backspace() {
    if (this.activeInput && this.activeInput.startsWith("capacity")) {
      const inputField = this.activeInput.substring("capacity".length); // Extract field name from activeInput
      this.machineCapacityView[inputField] = this.machineCapacityView[
        inputField
      ].slice(0, -1);
    } else if (this.activeInput && this.activeInput.startsWith("sensor")) {
      const inputField = this.activeInput.substring("sensor".length); // Extract field name from activeInput
      this.machineSensorView[inputField] = this.machineSensorView[
        inputField
      ].slice(0, -1);
    }
  }
  iskeyboardPopupOpen = false;

  openKeyboard(inputField: string) {
    this.activeInput = inputField;
    this.iskeyboardPopupOpen = true;
  }

  closeKeyBoard() {
    this.iskeyboardPopupOpen = false;
  }

  /* End Virtual Keybord popup */
}
