import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { RouteUrlConstants } from "src/app/appConfig";
import { MachineErrorTypeOperationView } from "src/app/_classes/MachineErrorTypeOperationView";
import { MachineErrorTypeView } from "src/app/_classes/MachineErrorTypeView";
import { SocketResponseView } from "src/app/_classes/SocketResponseView";
import { WebSocketService } from "src/app/_services/webSocketService";
import { FormBuilder } from "@angular/forms";
import { SensorDataView } from "src/app/_classes/SensorDataView";

@Component({
  selector: "app-maintenance-mode",
  templateUrl: "./maintenance-mode.component.html",
  styleUrls: ["./maintenance-mode.component.css"],
})
export class MaintenanceModeComponent implements OnInit, OnDestroy {
  public outOfServiceMessage;
  public socketMessage;
  public socketConnectionStatus;
  public currentErrors: Array<MachineErrorTypeView> =
    new Array<MachineErrorTypeView>();
  public sensorDataModels: Array<SensorDataView> = new Array<SensorDataView>();
  public showMachineIsReady = true;
  public showOutOfService = false;

  changeLocationPopup = false;
  hardResetButtonPopup = false;
  glassResetButtonPopup = false;
  aluResetButtonPopup = false;
  passwordIncorrectPopup = false;
  passwordHide = true;
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
    this.socketMessage = this.webSocketService.getSocketMessage.subscribe(
      (response: SocketResponseView) => {
        console.log("Socket Response In Maintenance Mode Component");
        console.log(response);
        if (response.socketCommand == 1) {
          this.machineIsReady();
          if (response.maintenanceModeResponseView != null) {
            this.currentErrors =
              response.maintenanceModeResponseView.currentErrors;
            console.log(this.currentErrors);
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
    let loginMessageObject = {
      clientCommand: 2,
      maintenanceSocketRequestView: {
        login: true,
      },
    };
    this.webSocketService.getWebSocket.message(loginMessageObject);
  }

  changeLocation() {
    this.changeLocationPopup = true;
  }

  hardResetPressed() {
    this.hardResetButtonPopup = true;
  }

  passwordSubmit() {
    console.log(this.checkoutForm.value);
    var number = this.checkoutForm.value;
    console.log(number.password);

    let maintenanceOperationMessage = {
      clientCommand: 5,
      password: number.password,
    };
    this.webSocketService.getWebSocket.message(maintenanceOperationMessage);
    this.changeLocationPopup = false;
    this.checkoutForm.get("password")?.setValue(null);
  }

  closePopupFun() {
    this.changeLocationPopup = false;
    this.passwordIncorrectPopup = false;
    this.hardResetButtonPopup = false;
    this.glassResetButtonPopup = false;
    this.aluResetButtonPopup = false;
    this.checkoutForm.get("password")?.setValue(null);
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

  doOperation(
    plcRegisterType,
    registerAddress,
    registerOperation,
    resolve,
    resolveErrorId,
    errorName
  ) {
    console.log("hiii");
    if (errorName == "maintenance.GLASS_BIN_FULL_COUNT") {
      this.glassResetButtonPopup = true;
    } else if (errorName == "maintenance.ALUMINIUMN_BIN_FULL_COUNT") {
      this.aluResetButtonPopup = true;
    } else {
      let maintenanceOperationMessage = {
        clientCommand: 2,
        maintenanceSocketRequestView: {
          login: true,
          plcRegisterType: plcRegisterType,
          registerAddress: registerAddress,
          registerOperation: registerOperation,
          resolve: resolve,
          resolveErrorId: resolveErrorId,
          errorName: errorName,
        },
      };
      this.webSocketService.getWebSocket.message(maintenanceOperationMessage);
    }
  }
  hardResetSubmit() {
    console.log(this.checkoutForm.value);
    var number = this.checkoutForm.value;
    console.log(number.password);

    let maintenanceOperationMessage = {
      clientCommand: 6,
      password: number.password,
    };
    this.webSocketService.getWebSocket.message(maintenanceOperationMessage);
    this.hardResetButtonPopup = false;
    this.checkoutForm.get("password")?.setValue(null);
  }

  glassResetSubmit() {
    console.log(this.checkoutForm.value);
    var number = this.checkoutForm.value;
    console.log(number.password);

    let maintenanceOperationMessage = {
      clientCommand: 2,
      maintenanceSocketRequestView: {
        login: true,
        plcRegisterType: 3,
        registerAddress: 0,
        registerOperation: 1,
        resolve: false,
        resolveErrorId: null,
        errorName: "maintenance.GLASS_BIN_FULL_COUNT",
      },
      password: number.password,
    };
    this.webSocketService.getWebSocket.message(maintenanceOperationMessage);
    this.glassResetButtonPopup = false;
    this.checkoutForm.get("password")?.setValue(null);
  }

  aluResetSubmit() {
    console.log(this.checkoutForm.value);
    var number = this.checkoutForm.value;
    console.log(number.password);

    let maintenanceOperationMessage = {
      clientCommand: 2,
      maintenanceSocketRequestView: {
        login: true,
        plcRegisterType: 3,
        registerAddress: 0,
        registerOperation: 1,
        resolve: false,
        resolveErrorId: null,
        errorName: "maintenance.ALUMINIUMN_BIN_FULL_COUNT",
      },
      password: number.password,
    };
    this.webSocketService.getWebSocket.message(maintenanceOperationMessage);
    this.aluResetButtonPopup = false;
    this.checkoutForm.get("password")?.setValue(null);
  }

  doStopOperation(machineErrorTypeView: MachineErrorTypeView) {
    console.log(machineErrorTypeView);
    machineErrorTypeView.errorTypeOperationModel.forEach(
      (errorTypeOperationModel: MachineErrorTypeOperationView) => {
        this.doOperation(
          errorTypeOperationModel.plcRegisterModel?.type?.key,
          errorTypeOperationModel.plcRegisterModel.address,
          errorTypeOperationModel.defaultValue,
          false,
          null,
          machineErrorTypeView.plcRegisterModel.name
        );
      }
    );
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

  technicianMode() {
    this.router.navigateByUrl("/" + RouteUrlConstants.technician_mode);
  }

  //Start Virtual Keybord popup
  textInput: string = "";
  iskeyboardPopupOpen = false;
  keyboardRows: string[][] = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["0"],
  ];
  appendToInput(key: string) {
    if (this.textInput === undefined) {
      this.textInput = key;
    } else {
      this.textInput += key;
    }
  }
  backspace() {
    this.textInput = this.textInput.slice(0, -1);
  }
  openKeyboard() {
    this.iskeyboardPopupOpen = true;
  }
  closeKeyBoard() {
    this.iskeyboardPopupOpen = false;
  }
  //End Virtual Keybord popup
}
