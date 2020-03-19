

$(function(){
    $(".ce > li > a").click(function(){
	     $(this).addClass("xz").parents().siblings().find("a").removeClass("xz");
		 $(this).parents().siblings().find(".er").hide(300);
		 $(this).siblings(".er").toggle(300);
		 $(this).parents().siblings().find(".er > li > .thr").hide().parents().siblings().find(".for").hide();
		
	})
	
    $(".er > li > a").click(function(){
        $(this).addClass("sen_x").parents().siblings().find("a").removeClass("sen_x");
        $(this).parents().siblings().find(".thr").hide(300);	
	    $(this).siblings(".thr").toggle(300);	
	})

    $(".thr > li > a").click(function(){
	     $(this).addClass("xuan").parents().siblings().find("a").removeClass("xuan");
		 $(this).parents().siblings().find(".for").hide();	
	     $(this).siblings(".for").toggle();
	})

    $(".for > li > a").click(function(){
	     $(this).addClass("cloud").parents().siblings().find("a").removeClass("cloud");
		 $(this).parents().siblings().find(".for_nr").hide();	
	     $(this).siblings(".for_nr").toggle();
	})






})


 




























