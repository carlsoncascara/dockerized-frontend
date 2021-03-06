import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Employee } from '../employee';
import { EmployeeService } from '../../employee.service';
import { uniqueEmployeeValue, validateBirthdate } from '../employee.validator';
import { Skill } from '../../skill/skill';
import { SkillService } from '../../skill.service';

@Component({
  selector: 'app-employees',
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.css']
})
export class EmployeesComponent implements OnInit {

  employeeID : number = 1;
  employees : Employee[] = [];
  skillGroup : Skill[] = [];
  employeeForm : FormGroup | undefined;

  toDelete : number = -1;

  showToast = false;
  actionMessage = "";

  constructor(
    private formBuilder : FormBuilder,
    private employeeService : EmployeeService,
    private skillService : SkillService
  ) { }
  
  ngOnInit(): void {
    this.getSkills();
  }

  initSelectedSkill() : void {
    for(let skill in this.skillGroup){
      this.skills.push(this.formBuilder.control(false));
    }
  }

  initializeBuilder() {
    for(;this.employees.findIndex(emp=>emp.employeeID==this.employeeID) > -1; this.employeeID++);

    return this.formBuilder.group({
      employeeID : [this.employeeID],
        firstName: [ '', Validators.required ],
        lastName: [ '', Validators.required ],
        birthdate: [ '', [
              Validators.required,
              validateBirthdate(this.employeeService)
            ]
        ],
        skills: this.formBuilder.array([])
      },
      { updateOn: 'blur' }
    );
  }
  
  getEmployees() : void {
    this.employeeService.getDBEmployees()
      .subscribe(
        employees=>{
          this.employees = employees.map(employee=>{
            return {
              employeeID: employee.employeeID,
              firstName: employee.firstName,
              lastName: employee.lastName,
              birthdate: employee.birthdate,
              skills: employee.skills
            }
          });
        },
        err=>console.log(err),
        ()=>{
          this.employeeForm = this.initializeBuilder();
          this.initSelectedSkill();
        }
      );
  }

  generateID():void{
    this.employeeService.nextID().subscribe(
      response=>this.employeeID = response,
      err=>console.error(err),
      ()=>{
        this.getEmployees();
      }
    );
  }

  getSkills() : void {
    this.skillService.getDBSkills()
      .subscribe(
        (skills)=>this.skillGroup=skills,
        err=>console.log(err),
        ()=>{
          this.employeeService.nextID().subscribe(
            response=>this.employeeID = response,
            err=>console.error(err),
            ()=>{
              this.generateID();
            }
          );
        }
      );
  }

  addEmployee() : void {
    let employee = this.employeeForm?.value;
    let data : Employee = {
      employeeID: employee.employeeID,
      firstName: employee.firstName,
      lastName: employee.lastName,
      birthdate: employee.birthdate,
      skills: this.getSkillID(employee.skills)
    }
    this.employeeService.postDBEmployee(data).subscribe(
      res=>console.log(res),
      err=>console.error(err),
      ()=>{
        this.employeeForm?.patchValue({
          employeeID: '',
          firstName: '',
          lastName: '',
          birthdate: ''
        });
        this.skills.clear();
        this.generateID();
        document.getElementById("employeeID")?.focus();
        this.actionMessage = "New Employee Added!";
        this.toShowToast();
      }
    );
  }

  getSkillID(selectedSkill : boolean[]){
    var ids : number[] = [];
    this.skillGroup.forEach((value, index)=>{
      if(selectedSkill[index]){
        ids.push(value.id);
      }
    });
    return ids;
  }

  getAge(date : any) {
    return this.employeeService.getEmployeeAge(date);
  }

  get empID() {
    return this.employeeForm?.get("employeeID");
  }

  get fname() {
    return this.employeeForm?.get("firstName");
  }

  get lname() {
    return this.employeeForm?.get("lastName");
  }

  get bdate() {
    return this.employeeForm?.get("birthdate");
  }
  
  get skills() {
    return this.employeeForm?.get("skills") as FormArray;
  }

  getSkillName(id : number) : string {
    const skill = this.skillGroup.filter(skill=>skill.id==id);
    return skill[0].name;
  }

  deleteEmployee(employeeID : number) : void{
    const employeeName = this.employees.find( emp => emp.employeeID == employeeID )?.firstName; 
    this.employeeService.deleteDBEmployee(employeeID).subscribe(
      res=>console.log(res),
      err=>console.log(err),
      ()=>{
        this.getEmployees();
        document.getElementById("modalCloseBtn")?.click();
        this.actionMessage = "Employee " + employeeName + " has been removed!";
        this.toShowToast();
      }
    );
  }

  toRemove(employeeID : number) : void {
    this.toDelete = employeeID;
  }

  toShowToast() {
    this.showToast = true;
    setTimeout(() => this.showToast = false, 4000);
  }

}
