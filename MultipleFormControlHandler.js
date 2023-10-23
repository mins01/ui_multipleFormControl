"use strict";

class MultipleFormControlHandler{
    static instance = null;
    static getInstance(){
        if(!this.instance){
            this.instance = new this();
        }
        return this.instance;
    }
    static activate(){
        let instance = this.getInstance();
        instance.printDebug('activate');
        if(!globalThis?.window){ throw('window is not exists'); }
        instance.addEventListener(globalThis?.window);
        this.adjustAll()
    }
    static deactivate(){
        let instance = this.getInstance();
        instance.printDebug('deactivate');
        instance.removeEventListener();
    }
    static adjustAll(){
        const instance = this.getInstance();
        document.querySelectorAll('.mfch-container').forEach((container)=>{
            instance.adjust(container)
        })
    }

    //---------------------------

    activated = false;
    listener = null;
    target = null;
    debug = false;

    /**
     * @constructs
     */
    constructor(){
        this.activated = false; //동작
        this.listener = null; // 이벤트를 붙이는 대상. 기본은 window
        this.target = null; // 최초 이벤트 발생 요소(pointerdown 에서 event.target)
        this.reset();
    }
    
    /**
     * 초기화
     */
    reset(){

    }
    /**
     * 디버깅용 (개발용)
     */
    printDebug(){
        if(!this.debug){return;}
        console.log.apply(null, [this.constructor.name , ...arguments]);
    }


    addEventListener(listener){
        this.listener = listener;
        this.listener.addEventListener('keydown',this.cb_keydown);
        this.listener.addEventListener('click',this.cb_click);
    }
    removeEventListener(){
        this.listener.removeEventListener('keydown',this.cb_keydown);
        this.listener.removeEventListener('click',this.cb_click);
    }


    getContainer(target){
        return target.closest('.mfch-container');
    }
    getItem(target){
        return target.closest('.mfch-item');
    }

    cb_keydown = (event)=>{ this.keydown(event); }

    keydown(event){
        this.printDebug(event);
        if (event.defaultPrevented) {
            return; // Do nothing if the event was already processed
        }
        return this.processForKeyboard(event);
    }

    cb_click = (event)=>{ this.click(event); }

    click(event){
        this.printDebug(event);
        if (event.defaultPrevented) {
            return; // Do nothing if the event was already processed
        }
        return this.processForClick(event);
    }

    processForKeyboard(event){
        const container = this.getContainer(event.target);
        if(!container){ this.printDebug('skip 1'); return;}
        const item = this.getItem(event.target);
        if(!item){ this.printDebug('skip 2'); return;}
        const input = item.querySelector('input');
        if(!input){ this.printDebug('skip 3'); return;}

        const key = event.key;

        // switch (event.key) {
        //     case " ": break;
        //     case "Enter":  break;
        //     case "Backspace": break;

        //     // case "ArrowDown": break;
        //     // case "ArrowUp": break;
        //     // case "ArrowLeft": break;
        //     // case "ArrowRight": break;
        //     // case "Escape": break;
        //     default: break; // Quit when this doesn't handle the key event.
        // }

        let seperator = container.dataset.mfchSeperator??'( )';
        const regexp = new RegExp(seperator);
        if(regexp.test(event.key)){
            // this.printDebug('!seperator!');
            this.stopEvent(event);
            if(input.value.length == 0){
                this.printDebug('빈 문자열');
            }else if(!input.checkValidity()){
                this.printDebug('!checkValidity ');
            }else{
                this.containerAppendItem(container,item)
            }
        }

        // 삭제 동작
        if( container.dataset.mfchBackspace!='disabled' && event.key=='Backspace' && !event.repeat){
            if(input.value.length == 0){
                this.printDebug('삭제 진행');
                this.stopEvent(event);
                this.containerRemoveItem(container,item)
            }
        }
    }

    processForClick(event){
        const container = this.getContainer(event.target);
        if(!container){ this.printDebug('skip 1'); return;}
        const item = this.getItem(event.target);
        if(!item){ this.printDebug('skip 2'); return;}
        const input = item.querySelector('input');
        if(!input){ this.printDebug('skip 3'); return;}
        const key = event.key;

        if(event.target.classList.contains('mfch-item-btn-remove')){
            this.printDebug('제거 버튼 클릭');
            this.stopEvent(event);
            this.containerRemoveItem(container,item)
        }else if(event.target.classList.contains('mfch-item-btn-append')){
            this.printDebug('추가 버튼 클릭');
            this.stopEvent(event);
            this.containerAppendItem(container,item,true)
        }
    }
    


    stopEvent(event){
        event.stopPropagation();
        event.preventDefault();
    }










    /**
     * form-control element 가져오기
     */
    getFirstItem(container){
        return container.querySelector('.mfch-item')
    }
    /**
     * 
     * @param {HTMLElement} container 
     * @param {HTMLElement} item 
     * @param {boolean} forceAppend 강제 추가 여부(빈값 체크등을 안한다.)
     */
    containerAppendItem(container,item,forceAppend){
        // 다음요소를 찾아서 비어있다면 이 요소를 대신 사용한다.
        let next_item = this.getNextItem(item);
        
        let new_item = null;
        if(!forceAppend && next_item && next_item.querySelector('input , select , textarea').value ==''){
            new_item = next_item;
        }else{
            let maxItemNumber = parseInt(container.dataset.mfchMaxItemNumber??0);
            let itemNumber = this.getItems(container).length;
            if(maxItemNumber !== 0 && itemNumber >= maxItemNumber ){
                this.printDebug('최대에 도달',itemNumber , maxItemNumber );
                return false;
            }
            new_item = this.appendItem(container,item);
        }
        new_item.querySelector('input , select , textarea').focus();
        this.adjust(container);
    }
    appendItem(container,item){
        if(!item){
            let items = this.getItems(container);
            item = items[items.length-1];
        } 


        let new_item = item.cloneNode(true);
        new_item.querySelectorAll('input , select , textarea').forEach(el => {
            // el.value = el.defaultValue;
            el.value = '';
        });
        if(item){
            item.after(new_item)
        }else{
            container.appendChild(new_item)
        }
        container.dispatchEvent((new CustomEvent('mfch-appenditem', { 
            bubbles:true, 
            cancelable:true, 
            composed:true,
            detail:{'item':new_item},
        })));

        return new_item
    }
    getItems(container){
        return container.querySelectorAll('.mfch-item');
    }
    getNextItem(item){
        let next_item = item;
        if(next_item){
            do{
                next_item = next_item.nextElementSibling;
            }while(next_item && !next_item.classList.contains('mfch-item'))
        }
        return next_item;
    }
    getPreviousItem(item){
        let prev_item = item;
        if(prev_item){
            do{
                prev_item = prev_item.previousElementSibling;
            }while(prev_item && !prev_item.classList.contains('mfch-item'))
        }
        return prev_item;
    }
    containerRemoveItem(container,item,disableAutofocus){
        if(!item || !item.parentElement){return}

        const focus_item = this.removeItem(container,item);
        if(!focus_item) return false;
        if(!disableAutofocus) focus_item.querySelector('input , select , textarea').focus();
        this.adjust(container);
    }
    removeItem(container,item){
        let minItemNumber = parseInt(container.dataset.mfchMinItemNumber??1);
        let itemNumber = this.getItems(container).length;
        if(minItemNumber !== 0 && itemNumber <= minItemNumber ){
            this.printDebug('최소에 도달',itemNumber , minItemNumber );
            return false;
        }

        let focus_item = this.getPreviousItem(item)??this.getNextItem(item);
        if(!focus_item){
            this.printDebug('마지막 아이템 삭제 불가');
            return false;
        }
        item.remove();
        container.dispatchEvent((new CustomEvent('mfch-removeitem', { 
            bubbles:true, 
            cancelable:true, 
            composed:true,
            detail:{'item':item},
        })));
        return focus_item;
    }
    /**
     * 불필요한 빈 요소 삭제
     * @param {HTMLElement} container 
     */
    adjust(container){
        let minItemNumber = parseInt(container.dataset.mfchMinItemNumber??1);
        let maxItemNumber = parseInt(container.dataset.mfchMaxItemNumber??0);
        let items = this.getItems(container);
        let itemNumber = items.length;
        
        if(itemNumber < minItemNumber){
            this.printDebug('min 처리');
            let lastItem = items[items.length-1];
            let gap = minItemNumber - itemNumber;
            while(gap--){
                this.appendItem(container,lastItem)
            }
        }
        if(maxItemNumber !== 0 && itemNumber > maxItemNumber){
            this.printDebug('max 처리');
            let gap = itemNumber - maxItemNumber;
            while(gap--){
                let removeItem = items[gap];
                this.removeItem(container,removeItem)
            }
        }

        
        items = this.getItems(container);
        itemNumber = items.length;

        container.dataset.mfchItemNumber = itemNumber;
        if(itemNumber == minItemNumber && itemNumber == maxItemNumber){
            container.dataset.mfchStateItemNumber = 'min max'
        }else if(itemNumber == minItemNumber){
            container.dataset.mfchStateItemNumber = 'min'
        }else if(itemNumber == maxItemNumber){
            container.dataset.mfchStateItemNumber = 'max'
        }else{
            container.dataset.mfchStateItemNumber = null
        }

        container.dispatchEvent((new CustomEvent('mfch-adjust', { 
            bubbles:true, 
            cancelable:true, 
            composed:true,
            detail:{},
        })));
    }






}