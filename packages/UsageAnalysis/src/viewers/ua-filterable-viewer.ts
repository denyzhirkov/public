import {UaFilter} from "../filter2";
import {UaQueryViewer} from "./ua-query-viewer";

export class UaFilterableViewer extends UaQueryViewer {

    public constructor(name: string, queryName: string, viewerFunction: Function, setStyle?: Function) {
        super(name, queryName, viewerFunction, setStyle);
    }

    reload(filter: UaFilter) {
        this.root.innerHTML = '';
        this.root.append(
            this.addCardWithFilters(
                this.name,
                this.queryName,
                filter,
                this.viewerFunction
            )
        );
    }

}