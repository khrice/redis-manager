import { Component, HostListener } from '@angular/core';
import { Http } from '@angular/http';

@Component({
    selector: 'my-app',
    template: `
        <div class="container">
            <div class="row">
                <div class="col-6">
                    <div *ngFor="let database of databaseKeys; let i = index;">
                        <span (click)="toggle(i)">{{i}} [{{databases[database].length}}]</span>
                        <div *ngIf="visibleDatabase === i">
                            <div *ngFor="let key of databases[database]">
                                <div class="key-row">
                                    <button (click)="get(key, i, $event)" type="button" class="btn btn-link">{{key}}</button>
                                    <button style="float: right;" type="button" class="btn btn-danger" (click)="delete(key)">Delete</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-6">
                    <value-section [currentValue]="currentValue" [currentKey]="currentKey" [currentDatabase]="currentDatabase"></value-section>
                </div>
            </div>
            <div>
                <button type="button" class="btn btn-danger" (click)="deleteAll()">Delete Selected</button>
            </div>
        </div>
    `,
    styles: ['.row, .key-row { padding-top: 5px; }']
})
export class AppComponent {
    databases: Object;
    databaseKeys: Array<Object>;
    visibleDatabase = 0;
    currentValue;
    currentKey;
    currentDatabase;
    textAreaValue;
    start;
    end;
    constructor(private http: Http) { 
        this.fetch();
    }

    fetch() {
        this.http.post('/getDbsAndKeys', {}).subscribe((data) => {
            this.databases = data.json().keys;
            this.databaseKeys = Object.keys(this.databases);
        });
    }

    toggle(index) {
        if(this.visibleDatabase == index) {
            this.visibleDatabase = undefined;
            return;
        }
        this.visibleDatabase = index;
    }

    delete(key) {
        this.http.post('/removeRedisKey', {keys: [key]}).subscribe(()=>{
            this.fetch();
        });
    }

    deleteAll() {
        let keys = this.databases[this.currentDatabase].slice(this.start, this.end+1);
        this.http.post('/removeRedisKey', {keys: keys}).subscribe(()=>{
            this.fetch();
        });
    }

    get(key, db, event) {
        if(event.shiftKey) {
            this.checkSelection(key, db);
        }
        this.currentKey = key;
        this.currentDatabase = db;
        this.http.post('/getRedisValue', {key: key, db: db}).subscribe((data)=>{
            this.currentValue = data.json().result;
        });
    }

    set() {
        this.http.post('/setRedisValue', {key: this.currentKey, db: this.currentDatabase, value: JSON.stringify(this.textAreaValue)}).subscribe((data)=>{
            this.currentValue = data.json().result;
            this.textAreaValue = this.currentValue;
        });
    }

    textAreaChange(event) {
        this.textAreaValue = event.target.value;
    }

    checkSelection(key, db) {
        let start = this.databases[db].indexOf(this.currentKey);
        let end = this.databases[db].indexOf(key);
        //This is to handle a user clicking the first item that is below (or after) the second item
        if(end - start < 0) {
            this.start = end;
            this.end = start;
        } else {
            this.start = start;
            this.end = end;
        }
    }
 
}